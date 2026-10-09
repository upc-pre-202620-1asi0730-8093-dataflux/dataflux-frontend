import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createWorkflowHarness,
  equipmentResource,
  rentalResource,
} from "../../../../tests/helpers/workflow-harness.js";

afterEach(() => vi.unstubAllGlobals());

const incidentResource = (blocksRental = true, status = "OPEN") => ({
  id: 1,
  equipmentId: 1,
  description: "Fictional inspection finding",
  reportedAt: "2030-01-09T05:00:00.000Z",
  blocksRental,
  status,
  resolvedAt: status === "RESOLVED" ? "2030-01-10T05:00:00.000Z" : null,
});

async function loadIncidents(store) {
  store.loadForCompany(1);
  await vi.waitFor(() => expect(store.loading.value).toBe(false));
  expect(store.error.value).toBeNull();
}

const availableWrites = (calls) =>
  calls.filter(
    (call) =>
      call.method === "PATCH" &&
      call.resource === "equipment" &&
      call.body?.status === "AVAILABLE",
  );

describe("Maintenance: inspected equipment returns to service", () => {
  it("completes a maintenance return and inspection without manufacturing an incident", async () => {
    const { services, db } = await createWorkflowHarness({
      equipment: [equipmentResource("RENTED")],
      rentals: [rentalResource()],
    });
    services.rentals.loadActiveRentalsForCompany(1);
    await vi.waitFor(() => expect(services.rentals.loading.value).toBe(false));
    expect(services.rentals.error.value).toBeNull();
    services.rentals.registerReturn(
      1,
      new Date("2030-01-09T05:00:00.000Z"),
      "",
      true,
    );
    await vi.waitFor(() =>
      expect(services.rentals.operationSuccess.value).toBe("RETURN"),
    );
    expect(db.equipment[0].status).toBe("MAINTENANCE");
    services.maintenance.loadForCompany(1);
    await vi.waitFor(() =>
      expect(services.maintenance.loading.value).toBe(false),
    );
    services.maintenance.registerMaintenance(
      1,
      1,
      new Date("2030-01-10T05:00:00.000Z"),
      "Inspection completed",
    );
    await vi.waitFor(() =>
      expect(services.maintenance.saveSucceeded.value).toBe(true),
    );
    await loadIncidents(services.incidents);
    expect(
      services.incidents.reactivatableEquipment.value.map((item) => item.id),
    ).toEqual([1]);
    services.incidents.reactivateEquipment(1, 1, true);
    await vi.waitFor(() =>
      expect(services.incidents.reactivationSucceeded.value).toBe(true),
    );
    expect(services.incidents.error.value).toBeNull();
    expect(db.equipment[0].status).toBe("AVAILABLE");
    expect(db.rentals[0].status).toBe("COMPLETED");
    expect(db["equipment-returns"]).toHaveLength(1);
    expect(db.maintenances).toHaveLength(1);
    expect(db.maintenances[0].status).toBe("COMPLETED");
    expect(db.incidents).toEqual([]);
  }, 15000);

  it("requires the operator to confirm the technical inspection", async () => {
    const { services, db, calls } = await createWorkflowHarness();
    await loadIncidents(services.incidents);
    services.incidents.reactivateEquipment(1, 1, false);
    expect(services.incidents.error.value).toContain(
      "Confirm the technical inspection",
    );
    expect(db.equipment[0].status).toBe("MAINTENANCE");
    expect(availableWrites(calls)).toHaveLength(0);
  });

  it("keeps equipment restricted while a known blocking incident is open", async () => {
    const { services, db, calls } = await createWorkflowHarness({
      incidents: [incidentResource()],
    });
    await loadIncidents(services.incidents);
    expect(services.incidents.reactivatableEquipment.value).toHaveLength(0);
    services.incidents.reactivateEquipment(1, 1, true);
    expect(services.incidents.error.value).toContain(
      "unresolved blocking incidents",
    );
    expect(db.equipment[0].status).toBe("MAINTENANCE");
    expect(availableWrites(calls)).toHaveLength(0);
  });

  it("rechecks incidents added after the equipment list was loaded", async () => {
    const { services, db, calls } = await createWorkflowHarness();
    await loadIncidents(services.incidents);
    db.incidents.push(incidentResource());
    services.incidents.reactivateEquipment(1, 1, true);
    await vi.waitFor(() =>
      expect(services.incidents.reactivatingEquipmentId.value).toBeNull(),
    );
    expect(services.incidents.error.value).toContain(
      "New or unresolved blocking incidents",
    );
    expect(db.equipment[0].status).toBe("MAINTENANCE");
    expect(availableWrites(calls)).toHaveLength(0);
  });

  it("does not reactivate equipment with an active rental", async () => {
    const { services, db, calls } = await createWorkflowHarness({
      rentals: [rentalResource()],
    });
    await loadIncidents(services.incidents);
    services.incidents.reactivateEquipment(1, 1, true);
    await vi.waitFor(() =>
      expect(services.incidents.reactivatingEquipmentId.value).toBeNull(),
    );
    expect(services.incidents.error.value).toContain("active rental");
    expect(db.equipment[0].status).toBe("MAINTENANCE");
    expect(availableWrites(calls)).toHaveLength(0);
  });

  it.each([
    ["an open nonblocking finding", incidentResource(false)],
    ["a resolved blocking finding", incidentResource(true, "RESOLVED")],
  ])("allows inspection with %s", async (_, incident) => {
    const { services, db } = await createWorkflowHarness({
      incidents: [incident],
    });
    await loadIncidents(services.incidents);
    services.incidents.reactivateEquipment(1, 1, true);
    await vi.waitFor(() =>
      expect(services.incidents.reactivationSucceeded.value).toBe(true),
    );
    expect(db.equipment[0].status).toBe("AVAILABLE");
    expect(db.incidents).toEqual([incident]);
  });

  it.each([
    ["owner", { userId: 99 }, "does not belong to this company"],
    ["state", { status: "RENTED" }, "Only equipment in MAINTENANCE"],
  ])("rechecks the equipment %s before writing", async (_, change, message) => {
    const { services, db, calls } = await createWorkflowHarness();
    await loadIncidents(services.incidents);
    Object.assign(db.equipment[0], change);
    services.incidents.reactivateEquipment(1, 1, true);
    await vi.waitFor(() =>
      expect(services.incidents.reactivatingEquipmentId.value).toBeNull(),
    );
    expect(services.incidents.reactivationSucceeded.value).toBe(false);
    expect(services.incidents.error.value).toContain(message);
    expect(availableWrites(calls)).toHaveLength(0);
  });
});
