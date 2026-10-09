import { afterEach, vi } from 'vitest';

let restoreTransport;
afterEach(() => {
  restoreTransport?.();
  restoreTransport = undefined;
});

export const equipmentResource = (status = 'AVAILABLE') => ({
  id: 1, userId: 1, code: 'TEST-1', name: 'Fictional equipment', description: 'Local fixture',
  categoryId: 1, location: 'Lima', dailyRate: 100, weeklyRate: 600, status, availabilityBlocks: [],
});
export const rentalResource = (status = 'CONFIRMED') => ({
  id: 1, equipmentId: 1, constructionUserId: 2, rentalCompanyUserId: 1,
  startDate: '2030-01-01T05:00:00.000Z', endDate: '2030-01-10T04:59:59.999Z', status,
});
export const requestResource = () => ({ ...rentalResource('PENDING'), createdAt: '2029-12-01T05:00:00.000Z' });

// Only transport is replaced; Rentals composition, domain, APIs and ACLs remain real.
export async function createRentalHarness(resources = {}) {
  vi.resetModules();
  const storage = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  });
  const db = structuredClone({
    equipment: [equipmentResource()], profiles: [], incidents: [], rentals: [],
    'rental-requests': [], deliveries: [], 'equipment-returns': [], ...resources,
  });
  const calls = [];
  const faults = [];
  const reply = (status, data) => ({ status, data: structuredClone(data) });
  const transport = async (rawUrl, options = {}) => {
    const url = new URL(rawUrl);
    const [resource, rawId] = url.pathname.replace(/^\/api\/v1\//, '').split('/');
    const id = rawId === undefined ? null : Number(rawId);
    const request = { method: options.method ?? 'GET', resource, id,
      body: options.body ? JSON.parse(options.body) : undefined };
    calls.push(request);
    const fault = faults.find((item) => item.matches(request));
    if (fault) faults.splice(faults.indexOf(fault), 1);
    if (fault?.phase === 'before') return reply(503, { message: 'Controlled transport failure' });
    const rows = db[resource];
    if (!rows) return reply(404, { message: 'Unknown test resource' });
    let response;
    if (request.method === 'GET') {
      const result = id === null ? rows.filter((row) => [...url.searchParams].every(
        ([key, value]) => String(row[key]) === value,
      )) : rows.find((row) => row.id === id);
      response = result === undefined ? reply(404, { message: 'Not found' }) : reply(200, result);
    } else if (request.method === 'POST') {
      const row = { ...request.body, id: Math.max(0, ...rows.map((item) => item.id)) + 1 };
      rows.push(row);
      response = reply(201, row);
    } else {
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) return reply(404, { message: 'Not found' });
      if (request.method === 'DELETE') {
        rows.splice(index, 1);
        response = reply(200, {});
      } else {
        rows[index] = request.method === 'PATCH' ? { ...rows[index], ...request.body } : { ...request.body, id };
        response = reply(200, rows[index]);
      }
    }
    return fault?.phase === 'after' ? reply(503, { message: 'Lost success response' }) : response;
  };
  const { default: axios } = await import('axios');
  const originalAdapter = axios.defaults.adapter;
  axios.defaults.adapter = async (config) => ({
    ...await transport(config.url, { method: config.method.toUpperCase(), body: config.data }),
    config, headers: {}, statusText: '',
  });
  restoreTransport = () => { axios.defaults.adapter = originalAdapter; };
  const { configureServices } = await import('../../../app.services.js');
  const { RentalsStore } = await import('../rentals.store.js');
  const { resolve } = await import('../../../shared/infrastructure/services.js');
  configureServices();
  const store = resolve(RentalsStore);
  const failNext = (matches, phase = 'before') => faults.push({ matches, phase });
  return { store, db, calls, failNext };
}
