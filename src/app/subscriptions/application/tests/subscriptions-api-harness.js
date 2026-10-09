import { vi } from "vitest";
import axios from "axios";

// Exercise the real store, API, endpoints and assemblers with only local HTTP data.
export async function createSubscriptionsHarness(resources = {}) {
  vi.resetModules();
  const values = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  });
  const db = structuredClone({
    "subscription-plans": [],
    "user-subscriptions": [],
    ...resources,
  });
  const calls = [];
  const heldResponses = [];
  const respond = (status, data) =>
    ({data, status});

  vi.spyOn(axios, "request").mockImplementation(async (options) => {
    const rawUrl = options.url;
    const url = new URL(rawUrl);
    const [resource, rawId] = url.pathname
      .replace(/^\/api\/v1\//, "")
      .split("/");
    const id = rawId === undefined ? null : Number(rawId);
    const method = options.method ?? "GET";
    const body = options.data;
    calls.push({ method, resource, id, body });
    const rows = db[resource];
    if (!Array.isArray(rows))
      return respond(404, { message: "Unknown test resource" });
    let response;
    if (method === "GET") {
      const result = id === null ? rows : rows.find((row) => row.id === id);
      response =
        result === undefined
          ? respond(404, { message: "Resource not found" })
          : respond(200, result);
    } else if (method === "POST") {
      const row = {
        ...body,
        id: Math.max(0, ...rows.map((row) => row.id)) + 1,
      };
      rows.push(row);
      response = respond(201, row);
    } else {
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) return respond(404, { message: "Resource not found" });
      rows[index] =
        method === "PATCH" ? { ...rows[index], ...body } : { ...body, id };
      response = respond(200, rows[index]);
    }
    const pending = heldResponses.find(
      (gate) => gate.method === method && gate.resource === resource,
    );
    if (pending) {
      heldResponses.splice(heldResponses.indexOf(pending), 1);
      pending.markStarted();
      const replacement = await pending.promise;
      if (replacement) response = respond(replacement.status, replacement.data);
    }
    return response;
  });

  function deferNextResponse(method, resource = "user-subscriptions") {
    let unlock;
    let markStarted;
    const promise = new Promise((resolve) => {
      unlock = resolve;
    });
    const started = new Promise((resolve) => {
      markStarted = resolve;
    });
    heldResponses.push({ method, resource, promise, markStarted });
    return {
      started,
      async release(replacement) {
        unlock(replacement);
        // Let the real HttpClient consume the released response before assertions.
        await new Promise((resolve) => setTimeout(resolve, 0));
      },
    };
  }

  const { SubscriptionsStore } = await import("../subscriptions.store.js");
  const { resolve, sessionEnded } =
    await import("../../../shared/infrastructure/services.js");
  const { clearSession } = await import("../subscriptions.module.js");
  const store = resolve(SubscriptionsStore);
  const resetSession = () => clearSession();
  const endSession = () => {
    sessionEnded.next();
    clearSession();
  };
  return { store, db, calls, deferNextResponse, resetSession, endSession };
}
