import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRentalHarness, equipmentResource, rentalResource, requestResource } from './tests/rental-api-harness.js';

afterEach(() => vi.unstubAllGlobals());
const date = () => new Date('2030-01-01T05:00:00.000Z');
const faultOn = (method, resource, condition = () => true) => (call) =>
  call.method === method && call.resource === resource && condition(call);
async function loadRequests(store) {
  store.loadRentalRequestsForCompany(1);
  await vi.waitFor(() => expect(store.loading.value).toBe(false));
  expect(store.error.value).toBeNull();
}
async function loadRentals(store) {
  store.loadActiveRentalsForCompany(1);
  await vi.waitFor(() => expect(store.loading.value).toBe(false));
  expect(store.error.value).toBeNull();
}
async function finishApproval(store) {
  await vi.waitFor(() => expect(store.updatingRequestId.value).toBeNull());
}
async function finishMovement(store) {
  await vi.waitFor(() => expect(store.updatingRentalId.value).toBeNull());
}

describe('Rentals: approval recovery', () => {
  it.each(['equipment', 'rentals', 'rental-requests'])('compensates a failed write to %s and permits a clean retry', async (resource) => {
    const { store, db, failNext } = await createRentalHarness({ 'rental-requests': [requestResource()] });
    await loadRequests(store);
    failNext(faultOn(resource === 'equipment' ? 'PATCH' : resource === 'rentals' ? 'POST' : 'PUT', resource));
    store.approveRentalRequest(1);
    await finishApproval(store);
    expect(store.error.value).toContain('Controlled transport failure');
    expect(db.equipment[0].availabilityBlocks).toEqual([]);
    expect(db.rentals).toEqual([]);
    expect(db['rental-requests'][0].status).toBe('PENDING');
    store.approveRentalRequest(1);
    await finishApproval(store);
    expect(store.error.value).toBeNull();
    expect(db.rentals).toHaveLength(1);
    expect(db.rentals[0].status).toBe('CONFIRMED');
    expect(db['rental-requests'][0].status).toBe('APPROVED');
    expect(db.equipment[0].availabilityBlocks).toHaveLength(1);
  });

  it.each(['equipment', 'rentals', 'rental-requests'])('verifies a lost success response from %s without duplicating effects', async (resource) => {
    const { store, db, failNext } = await createRentalHarness({ 'rental-requests': [requestResource()] });
    await loadRequests(store);
    failNext(faultOn(resource === 'equipment' ? 'PATCH' : resource === 'rentals' ? 'POST' : 'PUT', resource), 'after');
    store.approveRentalRequest(1);
    await finishApproval(store);
    expect(store.error.value).toBeNull();
    expect(db.rentals).toHaveLength(1);
    expect(db['rental-requests'][0].status).toBe('APPROVED');
    expect(db.equipment[0].availabilityBlocks).toHaveLength(1);
  });

  it('warns if reservation compensation fails and resumes the same reservation on retry', async () => {
    const { store, db, failNext } = await createRentalHarness({ 'rental-requests': [requestResource()] });
    await loadRequests(store);
    failNext(faultOn('POST', 'rentals'));
    failNext(faultOn('PATCH', 'equipment', (call) => call.body.availabilityBlocks?.length === 0));
    store.approveRentalRequest(1);
    await finishApproval(store);
    expect(store.error.value).toContain('Recovery incomplete');
    store.approveRentalRequest(1);
    await finishApproval(store);
    expect(store.error.value).toBeNull();
    expect(db.rentals).toHaveLength(1);
    expect(db.equipment[0].availabilityBlocks).toHaveLength(1);
    expect(db['rental-requests'][0].status).toBe('APPROVED');
  });

  it('does not release a reservation owned by another request', async () => {
    const equipment = equipmentResource();
    equipment.availabilityBlocks = [{ id: 5, rentalRequestId: 99, startDate: rentalResource().startDate, endDate: rentalResource().endDate }];
    const { store, db } = await createRentalHarness({ equipment: [equipment], 'rental-requests': [requestResource()] });
    await loadRequests(store);
    store.approveRentalRequest(1);
    await finishApproval(store);
    expect(store.error.value).toBeTruthy();
    expect(db.equipment[0].availabilityBlocks).toEqual(equipment.availabilityBlocks);
    expect(db.rentals).toEqual([]);
  });

  it('preserves other periods when compensating its own reservation', async () => {
    const equipment = equipmentResource();
    equipment.availabilityBlocks = [{ id: 5, rentalRequestId: 99, startDate: '2030-02-01T00:00:00.000Z', endDate: '2030-02-10T00:00:00.000Z' }];
    const { store, db, failNext } = await createRentalHarness({ equipment: [equipment], 'rental-requests': [requestResource()] });
    await loadRequests(store);
    failNext(faultOn('POST', 'rentals'));
    store.approveRentalRequest(1);
    await finishApproval(store);
    expect(db.equipment[0].availabilityBlocks).toEqual(equipment.availabilityBlocks);
    expect(db.rentals).toEqual([]);
  });

  it('retains the reservation if deleting the compensated rental fails and reuses both on retry', async () => {
    const { store, db, calls, failNext } = await createRentalHarness({ 'rental-requests': [requestResource()] });
    await loadRequests(store);
    failNext(faultOn('PUT', 'rental-requests'));
    failNext(faultOn('DELETE', 'rentals'));
    store.approveRentalRequest(1);
    await finishApproval(store);
    expect(store.error.value).toContain('Recovery incomplete');
    expect(db.rentals).toHaveLength(1);
    expect(db.rentals[0].rentalRequestId).toBe(1);
    expect(db.equipment[0].availabilityBlocks).toHaveLength(1);
    expect(db.equipment[0].availabilityBlocks[0].rentalRequestId).toBe(1);
    store.approveRentalRequest(1);
    await finishApproval(store);
    expect(store.error.value).toBeNull();
    expect(db['rental-requests'][0].status).toBe('APPROVED');
    expect(db.rentals).toHaveLength(1);
    expect(calls.filter(faultOn('POST', 'rentals'))).toHaveLength(1);
  });

  it.each(['equipment', 'rentals', 'rental-requests'])('reports an unverified %s write and resumes from persisted effects on retry', async (resource) => {
    const { store, db, failNext } = await createRentalHarness({ 'rental-requests': [requestResource()] });
    await loadRequests(store);
    failNext(faultOn(resource === 'equipment' ? 'PATCH' : resource === 'rentals' ? 'POST' : 'PUT', resource), 'after');
    failNext(faultOn('GET', resource, () => resource === 'equipment'
      ? db.equipment[0].availabilityBlocks.length === 1
      : resource === 'rentals' ? db.rentals.length === 1 : db['rental-requests'][0].status === 'APPROVED'));
    store.approveRentalRequest(1);
    await finishApproval(store);
    expect(store.error.value).toContain('write outcome could not be verified');
    expect(db.equipment[0].availabilityBlocks).toHaveLength(1);
    store.approveRentalRequest(1);
    await finishApproval(store);
    expect(store.error.value).toBeNull();
    expect(db.rentals).toHaveLength(1);
    expect(db.equipment[0].availabilityBlocks).toHaveLength(1);
    expect(db['rental-requests'][0].status).toBe('APPROVED');
  });
});

describe('Rentals: delivery and return recovery', () => {
  it.each(['equipment', 'rentals', 'deliveries'])('compensates delivery failure at %s and retries without duplicate records', async (resource) => {
    const { store, db, failNext } = await createRentalHarness({ rentals: [rentalResource()] });
    await loadRentals(store);
    failNext(faultOn(resource === 'equipment' ? 'PATCH' : resource === 'rentals' ? 'PUT' : 'POST', resource));
    store.registerDelivery(1, date(), 'Fictional delivery');
    await finishMovement(store);
    expect(store.error.value).toContain('Controlled transport failure');
    expect(db.rentals[0].status).toBe('CONFIRMED');
    expect(db.equipment[0].status).toBe('AVAILABLE');
    expect(db.deliveries).toEqual([]);
    store.registerDelivery(1, date(), 'Fictional delivery');
    await finishMovement(store);
    expect(store.operationSuccess.value).toBe('DELIVERY');
    expect(db.rentals[0].status).toBe('ACTIVE');
    expect(db.equipment[0].status).toBe('RENTED');
    expect(db.deliveries).toHaveLength(1);
  });

  it.each(['equipment', 'rentals', 'equipment-returns'])('compensates return failure at %s and retries without duplicate records', async (resource) => {
    const { store, db, failNext } = await createRentalHarness({ equipment: [equipmentResource('RENTED')], rentals: [rentalResource('ACTIVE')] });
    await loadRentals(store);
    failNext(faultOn(resource === 'equipment' ? 'PATCH' : resource === 'rentals' ? 'PUT' : 'POST', resource));
    store.registerReturn(1, date(), 'Fictional return', true);
    await finishMovement(store);
    expect(store.error.value).toContain('Controlled transport failure');
    expect(db.rentals[0].status).toBe('ACTIVE');
    expect(db.equipment[0].status).toBe('RENTED');
    expect(db['equipment-returns']).toEqual([]);
    store.registerReturn(1, date(), 'Fictional return', true);
    await finishMovement(store);
    expect(store.operationSuccess.value).toBe('RETURN');
    expect(db.rentals[0].status).toBe('COMPLETED');
    expect(db.equipment[0].status).toBe('MAINTENANCE');
    expect(db['equipment-returns']).toHaveLength(1);
  });

  it.each(['deliveries', 'equipment-returns'])('reconciles a committed %s POST with a lost response', async (resource) => {
    const returning = resource === 'equipment-returns';
    const { store, db, failNext } = await createRentalHarness({ equipment: [equipmentResource(returning ? 'RENTED' : 'AVAILABLE')], rentals: [rentalResource(returning ? 'ACTIVE' : 'CONFIRMED')] });
    await loadRentals(store);
    failNext(faultOn('POST', resource), 'after');
    if (returning) store.registerReturn(1, date(), '', true);
    else store.registerDelivery(1, date(), '');
    await finishMovement(store);
    expect(store.error.value).toBeNull();
    expect(store.operationSuccess.value).toBe(returning ? 'RETURN' : 'DELIVERY');
    expect(db[resource]).toHaveLength(1);
    expect(db.rentals[0].status).toBe(returning ? 'COMPLETED' : 'ACTIVE');
    expect(db.equipment[0].status).toBe(returning ? 'MAINTENANCE' : 'RENTED');
  });

  it('serializes repeated delivery confirmation in the same session', async () => {
    const { store, db } = await createRentalHarness({ rentals: [rentalResource()] });
    await loadRentals(store);
    store.registerDelivery(1, date(), '');
    store.registerDelivery(1, date(), '');
    await finishMovement(store);
    expect(store.operationSuccess.value).toBe('DELIVERY');
    expect(db.deliveries).toHaveLength(1);
  });

  it.each(['deliveries', 'equipment-returns'])('resumes a committed %s record after its verification read also fails', async (resource) => {
    const returning = resource === 'equipment-returns';
    const { store, db, calls, failNext } = await createRentalHarness({ equipment: [equipmentResource(returning ? 'RENTED' : 'AVAILABLE')], rentals: [rentalResource(returning ? 'ACTIVE' : 'CONFIRMED')] });
    await loadRentals(store);
    failNext(faultOn('POST', resource), 'after');
    failNext(faultOn('GET', resource, () => db[resource].length === 1));
    const confirm = () => returning ? store.registerReturn(1, date(), '', true) : store.registerDelivery(1, date(), '');
    confirm();
    await finishMovement(store);
    expect(store.error.value).toContain('write outcome could not be verified');
    expect(db.rentals[0].status).toBe(returning ? 'COMPLETED' : 'ACTIVE');
    confirm();
    await finishMovement(store);
    expect(store.error.value).toBeNull();
    expect(store.operationSuccess.value).toBe(returning ? 'RETURN' : 'DELIVERY');
    expect(db[resource]).toHaveLength(1);
    expect(calls.filter(faultOn('POST', resource))).toHaveLength(1);
  });

  it.each(['deliveries', 'equipment-returns'])('does not roll back equipment after rental compensation fails for %s, then resumes', async (resource) => {
    const returning = resource === 'equipment-returns';
    const previousStatus = returning ? 'ACTIVE' : 'CONFIRMED';
    const { store, db, failNext } = await createRentalHarness({ equipment: [equipmentResource(returning ? 'RENTED' : 'AVAILABLE')], rentals: [rentalResource(previousStatus)] });
    await loadRentals(store);
    failNext(faultOn('POST', resource));
    failNext(faultOn('PUT', 'rentals', (call) => call.body.status === previousStatus));
    const confirm = () => returning ? store.registerReturn(1, date(), '', true) : store.registerDelivery(1, date(), '');
    confirm();
    await finishMovement(store);
    expect(store.error.value).toContain('Recovery incomplete');
    expect(db.rentals[0].status).toBe(returning ? 'COMPLETED' : 'ACTIVE');
    expect(db.equipment[0].status).toBe(returning ? 'MAINTENANCE' : 'RENTED');
    expect(db[resource]).toEqual([]);
    confirm();
    await finishMovement(store);
    expect(store.error.value).toBeNull();
    expect(db[resource]).toHaveLength(1);
  });

  it('keeps request correlation through approval, delivery, Inventory serialization and an ordinary return', async () => {
    const equipment = { ...equipmentResource(), currency: 'USD' };
    const { store, db } = await createRentalHarness({ equipment: [equipment], 'rental-requests': [requestResource()] });
    await loadRequests(store);
    store.approveRentalRequest(1);
    await finishApproval(store);
    await loadRentals(store);
    store.registerDelivery(1, date(), '');
    await finishMovement(store);
    expect(db.rentals[0].rentalRequestId).toBe(1);
    const { EquipmentAssembler } = await import('../../inventory/infrastructure/equipment-assembler.js');
    const assembler = new EquipmentAssembler();
    const saved = assembler.toResourceFromEntity(assembler.toEntityFromResource(db.equipment[0]));
    expect(saved.currency).toBe('USD');
    expect(saved.availabilityBlocks[0].rentalRequestId).toBe(1);
    store.registerReturn(1, date(), '', false);
    await finishMovement(store);
    expect(store.error.value).toBeNull();
    expect(db.rentals[0].rentalRequestId).toBe(1);
    expect(db.rentals[0].status).toBe('COMPLETED');
    expect(db.equipment[0].status).toBe('AVAILABLE');
  });

  it('preserves Maintenance restrictions on a return without a requested inspection', async () => {
    const { store, db } = await createRentalHarness({ equipment: [equipmentResource('RENTED')], rentals: [rentalResource('ACTIVE')], incidents: [{ id: 1, equipmentId: 1, status: 'OPEN', blocksRental: true }] });
    await loadRentals(store);
    store.registerReturn(1, date(), '', false);
    await finishMovement(store);
    expect(store.error.value).toBeNull();
    expect(db.equipment[0].status).toBe('MAINTENANCE');
    expect(db.rentals[0].status).toBe('COMPLETED');
  });

  it.each([
    ['delivery', 'equipment'], ['delivery', 'rentals'], ['return', 'equipment'], ['return', 'rentals'],
  ])('resumes %s after an unverified %s status change', async (movement, resource) => {
    const returning = movement === 'return';
    const targetStatus = resource === 'equipment' ? (returning ? 'MAINTENANCE' : 'RENTED') : (returning ? 'COMPLETED' : 'ACTIVE');
    const { store, db, failNext } = await createRentalHarness({ equipment: [equipmentResource(returning ? 'RENTED' : 'AVAILABLE')], rentals: [rentalResource(returning ? 'ACTIVE' : 'CONFIRMED')] });
    await loadRentals(store);
    failNext(faultOn(resource === 'equipment' ? 'PATCH' : 'PUT', resource), 'after');
    failNext(faultOn('GET', resource, () => db[resource][0].status === targetStatus));
    const confirm = () => returning ? store.registerReturn(1, date(), '', true) : store.registerDelivery(1, date(), '');
    confirm();
    await finishMovement(store);
    expect(store.error.value).toContain('write outcome could not be verified');
    confirm();
    await finishMovement(store);
    expect(store.error.value).toBeNull();
    expect(db.rentals[0].status).toBe(returning ? 'COMPLETED' : 'ACTIVE');
    expect(db.equipment[0].status).toBe(returning ? 'MAINTENANCE' : 'RENTED');
    expect(db[returning ? 'equipment-returns' : 'deliveries']).toHaveLength(1);
  });

  it('refuses to duplicate a previously recorded delivery with conflicting details', async () => {
    const { store, db, calls } = await createRentalHarness({ rentals: [rentalResource()], deliveries: [{ id: 1, rentalId: 1, deliveredAt: date().toISOString(), notes: 'Previously recorded' }] });
    await loadRentals(store);
    store.registerDelivery(1, date(), 'Different details');
    await finishMovement(store);
    expect(store.error.value).toContain('conflicting rental record');
    expect(db.deliveries).toHaveLength(1);
    expect(db.deliveries[0].notes).toBe('Previously recorded');
    expect(calls.filter(faultOn('POST', 'deliveries'))).toHaveLength(0);
  });

  it('does not mutate an equipment or delivery when the fresh rental state has changed', async () => {
    const { store, db, calls } = await createRentalHarness({ rentals: [rentalResource()] });
    await loadRentals(store);
    db.rentals[0].status = 'COMPLETED';
    store.registerDelivery(1, date(), '');
    await finishMovement(store);
    expect(store.error.value).toContain('Rental status changed');
    expect(calls.filter(faultOn('PATCH', 'equipment'))).toHaveLength(0);
    expect(db.deliveries).toEqual([]);
  });
});
