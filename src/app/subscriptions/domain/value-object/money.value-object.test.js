import { describe, expect, it } from "vitest";
import { Money } from "./money.value-object.js";

describe("Subscription money invariants", () => {
  it("normalizes currency and permits a zero-priced demo plan", () => {
    const price = new Money({ amount: -0, currency: " pen " });
    expect(price.currency).toBe("PEN");
    expect(price.amount).toBe(0);
    expect(Object.is(price.amount, -0)).toBe(false);
  });

  it("rejects negative, non-finite and non-numeric prices at construction", () => {
    for (const amount of [
      -1,
      NaN,
      Infinity,
      -Infinity,
      "100",
      null,
      undefined,
    ]) {
      expect(() => new Money({ amount, currency: "PEN" })).toThrow(RangeError);
    }
    expect(() => new Money(null)).toThrow("Money amount");
  });

  it("rejects missing or malformed currency codes without a trim TypeError", () => {
    for (const currency of [
      "",
      "  ",
      "PE",
      "PENN",
      "123",
      "P€N",
      null,
      undefined,
      123,
    ]) {
      expect(() => new Money({ amount: 100, currency })).toThrow(
        "Money currency",
      );
    }
  });

  it("preserves the previous price when an amount mutation is invalid", () => {
    const price = new Money({ amount: 199.5, currency: "PEN" });
    for (const amount of [-0.01, NaN, Infinity, "300"]) {
      expect(() => {
        price.amount = amount;
      }).toThrow(RangeError);
      expect(price.amount).toBe(199.5);
    }
    price.amount = 0;
    expect(price.amount).toBe(0);
  });

  it("validates currency mutations before replacing the previous code", () => {
    const price = new Money({ amount: 99, currency: "PEN" });
    for (const currency of ["US", "", null, 1]) {
      expect(() => {
        price.currency = currency;
      }).toThrow("Money currency");
      expect(price.currency).toBe("PEN");
    }
    price.currency = " usd ";
    expect(price.currency).toBe("USD");
  });
});
