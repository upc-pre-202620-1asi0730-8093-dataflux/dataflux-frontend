import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSubscriptionsHarness } from "./tests/subscriptions-api-harness.js";

const now = new Date("2030-01-31T15:00:00.000Z");
beforeEach(() => vi.setSystemTime(now));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const plans = [1, 2, 3].map((id) => ({
  id,
  name: ["Essential", "Professional", "Growth"][id - 1],
  description: "Fictional monthly plan",
  priceAmount: 100,
  priceCurrency: "PEN",
  billingCycle: "MONTHLY",
  status: "ACTIVE",
}));
const subscription = (changes = {}) => ({
  id: 1,
  userId: 1,
  planId: 1,
  status: "ACTIVE",
  autoRenew: true,
  startDate: "2030-01-01T15:00:00.000Z",
  endDate: "2030-02-01T15:00:00.000Z",
  ...changes,
});
const expired = () =>
  subscription({
    startDate: "2020-01-01T15:00:00.000Z",
    endDate: "2020-02-01T15:00:00.000Z",
  });

async function loadStore(resources = {}) {
  const harness = await createSubscriptionsHarness({
    "subscription-plans": plans,
    "user-subscriptions": [expired()],
    ...resources,
  });
  const store = harness.store;
  store.loadPlans();
  store.loadCurrentSubscription(1);
  await vi.waitFor(() => {
    expect(store.loading.value).toBe(false);
    expect(store.subscriptionLoading.value).toBe(false);
  });
  expect(store.error.value).toBeNull();
  expect(store.subscriptionError.value).toBeNull();
  return { ...harness, store };
}

const writes = (calls) =>
  calls.filter(
    (call) => call.resource === "user-subscriptions" && call.method !== "GET",
  );

describe("Subscriptions: expiry and valid renewal periods", () => {
  it("does not present an expired ACTIVE record as current or renew it automatically", async () => {
    const { store, db, calls } = await loadStore();
    expect(store.currentSubscription.value).toBeNull();
    expect(db["user-subscriptions"]).toEqual([expired()]);
    expect(writes(calls)).toHaveLength(0);
  });

  it("allows selecting the same plan again and creates a valid monthly period", async () => {
    const { store, db } = await loadStore();
    store.subscribeToPlan(1, 1);
    await vi.waitFor(() => expect(store.subscriptionLoading.value).toBe(false));
    expect(store.subscriptionError.value).toBeNull();
    expect(store.currentSubscription.value?.planId).toBe(1);
    expect(db["user-subscriptions"]).toHaveLength(2);
    const renewed = db["user-subscriptions"][1];
    expect(renewed.startDate).toBe(now.toISOString());
    expect(renewed.endDate).toBe("2030-02-28T15:00:00.000Z");
    expect(renewed.status).toBe("ACTIVE");
    expect(db["user-subscriptions"][0]).toEqual(expired());
    store.loadCurrentSubscription(1);
    await vi.waitFor(() => expect(store.subscriptionLoading.value).toBe(false));
    expect(store.currentSubscription.value?.id).toBe(renewed.id);
  });

  it("selects a valid record even if an expired ACTIVE record appears first", async () => {
    const current = subscription({ id: 2, planId: 3 });
    const { store } = await loadStore({
      "user-subscriptions": [expired(), current],
    });
    expect(store.currentSubscription.value?.id).toBe(2);
    expect(store.currentSubscription.value?.planId).toBe(3);
  });

  it("does not treat a future ACTIVE period as current access", async () => {
    const future = subscription({
      startDate: "2030-02-02T15:00:00.000Z",
      endDate: "2030-03-02T15:00:00.000Z",
    });
    const { store, db, calls } = await loadStore({
      "user-subscriptions": [future],
    });
    expect(store.currentSubscription.value).toBeNull();
    expect(db["user-subscriptions"]).toEqual([future]);
    expect(writes(calls)).toHaveLength(0);
  });

  it("does not create another subscription while the current period is valid", async () => {
    const { store, db, calls } = await loadStore({
      "user-subscriptions": [subscription()],
    });
    store.subscribeToPlan(1, 2);
    expect(store.subscriptionError.value).toContain(
      "already has an active subscription",
    );
    expect(db["user-subscriptions"]).toHaveLength(1);
    expect(writes(calls)).toHaveLength(0);
  });

  it("preserves the period and renewal preference when changing a current plan", async () => {
    const original = subscription({ autoRenew: false });
    const { store, db } = await loadStore({ "user-subscriptions": [original] });
    store.changePlan(2);
    await vi.waitFor(() => expect(store.subscriptionLoading.value).toBe(false));
    expect(store.subscriptionError.value).toBeNull();
    expect(db["user-subscriptions"]).toEqual([{ ...original, planId: 2 }]);
  });

  it.each([1, 2])(
    "refreshes an expired cached period when confirming plan %s",
    async (planId) => {
      const { store, db } = await loadStore({
        "user-subscriptions": [subscription()],
      });
      const confirmationTime = new Date("2030-02-02T15:00:00.000Z");
      vi.setSystemTime(confirmationTime);
      store.changePlan(planId);
      await vi.waitFor(() =>
        expect(store.subscriptionLoading.value).toBe(false),
      );
      expect(store.subscriptionError.value).toBeNull();
      expect(db["user-subscriptions"]).toHaveLength(1);
      expect(db["user-subscriptions"][0]).toMatchObject({
        planId,
        startDate: confirmationTime.toISOString(),
        endDate: "2030-03-02T15:00:00.000Z",
        status: "ACTIVE",
      });
    },
  );

  it("allows a new subscription if the cached current period expired before selection", async () => {
    const { store, db } = await loadStore({
      "user-subscriptions": [subscription()],
    });
    vi.setSystemTime(new Date("2030-02-02T15:00:00.000Z"));
    store.subscribeToPlan(1, 3);
    await vi.waitFor(() => expect(store.subscriptionLoading.value).toBe(false));
    expect(store.subscriptionError.value).toBeNull();
    expect(db["user-subscriptions"]).toHaveLength(2);
    expect(store.currentSubscription.value?.planId).toBe(3);
    expect(db["user-subscriptions"][1].endDate).toBe(
      "2030-03-02T15:00:00.000Z",
    );
  });

  it("does not create duplicate subscriptions on repeated confirmation", async () => {
    const { store, db, calls } = await loadStore({ "user-subscriptions": [] });
    store.subscribeToPlan(1, 1);
    store.subscribeToPlan(1, 1);
    await vi.waitFor(() => expect(store.subscriptionLoading.value).toBe(false));
    expect(store.subscriptionError.value).toBeNull();
    expect(db["user-subscriptions"]).toHaveLength(1);
    expect(writes(calls)).toHaveLength(1);
  });

  it("ignores a second plan change while the first confirmation is pending", async () => {
    const { store, db, calls } = await loadStore({
      "user-subscriptions": [subscription()],
    });
    store.changePlan(2);
    store.changePlan(3);
    await vi.waitFor(() => expect(store.subscriptionLoading.value).toBe(false));
    expect(store.subscriptionError.value).toBeNull();
    expect(store.currentSubscription.value?.planId).toBe(2);
    expect(db["user-subscriptions"][0].planId).toBe(2);
    expect(writes(calls)).toHaveLength(1);
  });

  it.each(["subscribe", "change"])(
    "does not restore the previous identity after a pending %s",
    async (operation) => {
      const { store, deferNextResponse } = await loadStore({
        "user-subscriptions": operation === "subscribe" ? [] : [subscription()],
      });
      const delayed = deferNextResponse(
        operation === "subscribe" ? "POST" : "PUT",
      );
      if (operation === "subscribe") store.subscribeToPlan(1, 1);
      else store.changePlan(2);
      await delayed.started;
      store.clearCurrentSubscription();
      store.loadCurrentSubscription(2);
      await vi.waitFor(() =>
        expect(store.subscriptionLoading.value).toBe(false),
      );
      expect(store.currentSubscription.value).toBeNull();
      await delayed.release();
      expect(store.currentSubscription.value).toBeNull();
      expect(store.subscriptionError.value).toBeNull();
      expect(store.subscriptionLoading.value).toBe(false);
    },
  );

  it("rejects an unavailable plan without writing a renewal", async () => {
    const { store, db, calls } = await loadStore();
    store.subscribeToPlan(1, 99);
    expect(store.subscriptionError.value).toContain("not available");
    expect(db["user-subscriptions"]).toEqual([expired()]);
    expect(writes(calls)).toHaveLength(0);
  });
});

describe("Subscriptions: catalog requests across sessions", () => {
  it("clears a canceled catalog load so the next session can load plans", async () => {
    const { store, deferNextResponse, endSession } =
      await createSubscriptionsHarness({
        "subscription-plans": plans,
      });
    const delayed = deferNextResponse("GET", "subscription-plans");
    store.loadPlans();
    await delayed.started;
    endSession();
    const loadingAfterLogout = store.loading.value;
    await delayed.release();
    expect(loadingAfterLogout).toBe(false);
    expect(store.loading.value).toBe(false);
    expect(store.plans.value).toEqual([]);
    expect(store.error.value).toBeNull();
    store.loadPlans();
    await vi.waitFor(() => expect(store.loading.value).toBe(false));
    expect(store.plans.value.map((plan) => plan.id)).toEqual([1, 2, 3]);
  });

  it.each(["success", "error"])(
    "ignores an old catalog %s after reset and a newer load",
    async (result) => {
      const { store, db, deferNextResponse, resetSession } =
        await createSubscriptionsHarness({
          "subscription-plans": plans,
        });
      const delayed = deferNextResponse("GET", "subscription-plans");
      store.loadPlans();
      await delayed.started;
      resetSession();
      db["subscription-plans"] = [plans[2]];
      store.loadPlans();
      await vi.waitFor(() => expect(store.loading.value).toBe(false));
      expect(store.plans.value.map((plan) => plan.id)).toEqual([3]);
      await delayed.release(
        result === "error"
          ? { status: 503, data: { message: "Delayed test failure" } }
          : undefined,
      );
      expect(store.plans.value.map((plan) => plan.id)).toEqual([3]);
      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBeNull();
    },
  );
});
