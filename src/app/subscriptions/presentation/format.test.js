import { describe, expect, it } from "vitest";
import {
  canonicalLocale,
  date,
  money,
  subscriptionErrorKey,
} from "./format.js";

describe("Subscription presentation formats and errors", () => {
  it("uses canonical English and Latin American Spanish locales, including old aliases", () => {
    for (const locale of ["en", "en-US", "en_US"])
      expect(canonicalLocale(locale)).toBe("en-US");
    for (const locale of ["es", "es-419", "es_419"])
      expect(canonicalLocale(locale)).toBe("es-419");
    expect(canonicalLocale(null)).toBe("en-US");
  });

  it("localizes readable dates and currency while preserving the amount", () => {
    const day = new Date(2030, 0, 31, 12);
    expect(date(day, "en-US")).toContain("Jan");
    expect(date(day, "es-419")).toMatch(/ene/i);
    expect(date(day, "en_US")).toBe(date(day, "en-US"));
    expect(date(day, "es_419")).toBe(date(day, "es-419"));
    expect(money(1234.5, "USD", "en-US")).toBe("$1,234.50");
    expect(money(1234.5, "USD", "es-419")).toContain("1,234.50");
    expect(money(1234.5, "PEN", "es")).toContain("PEN");
    expect(money(1234.5, "pen", "es_419")).toBe(money(1234.5, "PEN", "es-419"));
  });

  it("shows a placeholder for invalid amounts, currencies and dates instead of crashing the view", () => {
    expect(date(new Date(NaN), "es")).toBe("—");
    expect(date("2030-01-31", "en")).toBe("—");
    expect(money(NaN, "PEN", "es")).toBe("—");
    expect(money(-1, "PEN", "en")).toBe("—");
    expect(money(10, "PE", "en")).toBe("—");
    expect(money(10, null, "es")).toBe("—");
  });

  it("maps domain errors to translation keys without displaying the English message", () => {
    expect(subscriptionErrorKey("The selected plan is not available")).toBe(
      "subscriptions.plans.errors.unavailable",
    );
    expect(
      subscriptionErrorKey("The selected plan is already the current plan"),
    ).toBe("subscriptions.plans.errors.same-plan");
    expect(
      subscriptionErrorKey(new Error("Failed to load current subscription")),
    ).toBe("subscriptions.plans.errors.load-current");
    expect(
      subscriptionErrorKey(
        "Failed to fetch entities: Date range contains an invalid date",
      ),
    ).toBe("subscriptions.plans.errors.invalid-data");
    expect(
      subscriptionErrorKey(
        "Failed to create entity: Money amount must be a valid non-negative number",
      ),
    ).toBe("subscriptions.plans.errors.invalid-data");
  });

  it("keeps unexpected service detail out of the displayed error and respects operation fallbacks", () => {
    const technical =
      "Failed to fetch entities: internal trace at http://localhost:3000/private";
    expect(subscriptionErrorKey(technical)).toBe(
      "subscriptions.plans.errors.fallback",
    );
    expect(
      subscriptionErrorKey(technical, "subscriptions.plans.load-error"),
    ).toBe("subscriptions.plans.load-error");
    expect(
      subscriptionErrorKey(technical, "subscriptions.plans.errors.update"),
    ).toBe("subscriptions.plans.errors.update");
    expect(subscriptionErrorKey(null)).toBeNull();
  });
});
