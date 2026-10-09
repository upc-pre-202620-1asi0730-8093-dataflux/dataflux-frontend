import { afterEach, expect, vi } from "vitest";

let restoreTransport;
afterEach(() => {
  restoreTransport?.();
  restoreTransport = undefined;
});

export const equipmentResource = (status = "MAINTENANCE") => ({
  id: 1,
  userId: 1,
  code: "TEST-1",
  name: "Fictional equipment",
  description: "Local test fixture",
  categoryId: 1,
  location: "Lima",
  dailyRate: 100,
  weeklyRate: 600,
  status,
  availabilityBlocks: [],
});

export const rentalResource = (status = "ACTIVE") => ({
  id: 1,
  equipmentId: 1,
  constructionUserId: 2,
  rentalCompanyUserId: 1,
  startDate: "2030-01-01T05:00:00.000Z",
  endDate: "2030-01-10T04:59:59.999Z",
  status,
});

// Replace only HTTP and browser storage; context composition, APIs and ACLs stay real.
export async function createWorkflowHarness(resources = {}) {
  vi.resetModules();
  const values = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  });
  const db = structuredClone({
    equipment: [equipmentResource()],
    "equipment-categories": [
      { id: 1, name: "Test category", description: "Fictional" },
    ],
    profiles: [],
    users: [],
    "rental-requests": [],
    rentals: [],
    deliveries: [],
    "equipment-returns": [],
    maintenances: [],
    incidents: [],
    "user-subscriptions": [],
    "subscription-plans": [],
    ...resources,
  });
  const calls = [];
  const respond = (status, data) =>
    ({ status, data: structuredClone(data) });
  const transport = async (rawUrl, options = {}) => {
    const url = new URL(rawUrl);
    const [resource, rawId] = url.pathname
      .replace(/^\/api\/v1\//, "")
      .split("/");
    const id = rawId === undefined ? null : Number(rawId);
    const method = options.method ?? "GET";
    const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ method, resource, id, body });
    const rows = db[resource];
    if (!Array.isArray(rows))
      return respond(404, { message: "Unknown test resource" });
    if (method === "GET") {
      const result =
        id === null
          ? rows.filter((row) =>
              [...url.searchParams].every(
                ([key, value]) => String(row[key]) === value,
              ),
            )
          : rows.find((row) => row.id === id);
      return result === undefined
        ? respond(404, { message: "Resource not found" })
        : respond(200, result);
    }
    if (method === "POST") {
      const row = {
        ...body,
        id: Math.max(0, ...rows.map((row) => row.id)) + 1,
      };
      rows.push(row);
      return respond(201, row);
    }
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) return respond(404, { message: "Resource not found" });
    rows[index] =
      method === "PATCH" ? { ...rows[index], ...body } : { ...body, id };
    return respond(200, rows[index]);
  };
  const { default: axios } = await import("axios");
  const originalAdapter = axios.defaults.adapter;
  axios.defaults.adapter = async (config) => ({
    ...await transport(config.url, { method: config.method.toUpperCase(), body: config.data }),
    config, headers: {}, statusText: "",
  });
  restoreTransport = () => { axios.defaults.adapter = originalAdapter; };
  const { configureServices, useServices } =
    await import("../../src/app/app.services.js");
  configureServices();
  const services = useServices();
  await vi.waitFor(() => expect(services.inventory.loading.value).toBe(false));
  return { services, db, calls };
}
