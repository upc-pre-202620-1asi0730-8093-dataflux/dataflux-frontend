import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { firstValueFrom } from "rxjs";
import { defineStore } from "pinia";
import { shallowRef, shallowReadonly } from "vue";
import { Money } from "../src/app/shared/domain/value-object/money.value-object.js";
import { RentalRate } from "../src/app/inventory/domain/value-object/rental-rate.value-object.js";
import { EquipmentAssembler } from "../src/app/inventory/infrastructure/equipment-assembler.js";
import {
  HttpClient,
  exposeStore,
  registerStore,
  resolve,
  pinia,
  sessionExpired,
} from "../src/app/shared/infrastructure/services.js";

describe("Money and rental prices", () => {
  it.each([-1, NaN, Infinity, "10"])("rejects invalid amount %s", (amount) => {
    expect(() => new Money({ amount, currency: "PEN" })).toThrow();
  });
  it("preserves zero, normalizes currency and prevents mutation", () => {
    const money = new Money({ amount: 0, currency: " pen " });
    expect(money.currency).toBe("PEN");
    expect(() => {
      money.amount = -50;
    }).toThrow();
    expect(money.amount).toBe(0);
  });
  it.each(["", "S/", undefined])("rejects invalid currency %s", (currency) => {
    expect(() => new Money({ amount: 1, currency })).toThrow();
  });
  it.each([NaN, Infinity, 0, -1])(
    "rejects invalid rental rate %s",
    (dailyRate) => {
      expect(() => new RentalRate({ dailyRate, weeklyRate: 100 })).toThrow();
    },
  );
  it("round-trips equipment prices and their currency through the API assembler", () => {
    const assembler = new EquipmentAssembler();
    const equipment = assembler.toEntityFromResource({
      id: 1,
      userId: 1,
      dailyRate: 15,
      weeklyRate: 80,
      currency: "USD",
      availabilityBlocks: [],
    });
    expect(equipment.rentalRate.dailyMoney).toBeInstanceOf(Money);
    expect(assembler.toResourceFromEntity(equipment)).toMatchObject({
      dailyRate: 15,
      weeklyRate: 80,
      currency: "USD",
    });
  });
});

describe("Pinia integration", () => {
  it("updates Pinia state through actions without proxying private-field entities", () => {
    class PriceStore {
      #state = shallowRef(new Money({ amount: 1, currency: "PEN" }));
      price = shallowReadonly(this.#state);
      update(amount) {
        this.#state.value = new Money({ amount, currency: "PEN" });
      }
    }
    const usePriceStore = defineStore("price-test", () =>
      exposeStore(new PriceStore()),
    );
    registerStore(PriceStore, usePriceStore);
    const facade = resolve(PriceStore);
    facade.update(12);
    expect(usePriceStore(pinia).price.amount).toBe(12);
    expect(facade.price.value.amount).toBe(12);
    expect(resolve(PriceStore)).toBe(facade);
  });
});

describe("Axios authentication and cancellation", () => {
  let storage;
  beforeEach(() => {
    storage = new Map([["token", "current-session"]]);
    vi.stubGlobal("localStorage", {
      getItem: (key) => storage.get(key) ?? null,
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  it("sends token and query parameters without mutating resource input", async () => {
    const request = vi
      .spyOn(axios, "request")
      .mockResolvedValue({ status: 200, data: { id: 2 } });
    const body = { id: 0, name: "Equipment" };
    await firstValueFrom(
      new HttpClient().request(
        "POST",
        "http://localhost/api/v1/equipment",
        body,
      ),
    );
    expect(request.mock.calls[0][0]).toMatchObject({
      data: { name: "Equipment" },
      headers: { Authorization: "Bearer current-session" },
    });
    expect(body.id).toBe(0);
  });
  it.each([
    ["/api/v1/profiles", false, 1],
    ["/api/v1/authentication/sign-in", false, 0],
    ["/api/v1/profiles", true, 0],
  ])(
    "handles 401 for %s with changed session %s",
    async (path, changed, expected) => {
      let finish;
      vi.spyOn(axios, "request").mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      const expired = vi.fn();
      const listener = sessionExpired.subscribe(expired);
      try {
        const response = firstValueFrom(
          new HttpClient().get("http://localhost" + path),
        );
        if (changed) storage.set("token", "new-session");
        finish({ status: 401, data: { message: "Unauthorized" } });
        await expect(response).rejects.toMatchObject({ status: 401 });
        expect(expired).toHaveBeenCalledTimes(expected);
      } finally {
        listener.unsubscribe();
      }
    },
  );
  it("aborts transport when an observable is unsubscribed", () => {
    const request = vi
      .spyOn(axios, "request")
      .mockImplementation(() => new Promise(() => {}));
    const subscription = new HttpClient()
      .get("http://localhost/api/v1/equipment")
      .subscribe();
    const signal = request.mock.calls[0][0].signal;
    subscription.unsubscribe();
    expect(signal.aborted).toBe(true);
  });
});
