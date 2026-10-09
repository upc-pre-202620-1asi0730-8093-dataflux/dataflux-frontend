import { Money } from "../domain/value-object/money.value-object.js";

export function canonicalLocale(locale = "en-US") {
  const normalized =
    typeof locale === "string" ? locale.replaceAll("_", "-") : "";
  return /^es(?:-|$)/i.test(normalized) ? "es-419" : "en-US";
}

export function date(value, locale = "en-US") {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) return "—";
  return new Intl.DateTimeFormat(canonicalLocale(locale), {
    dateStyle: "medium",
  }).format(value);
}

export function localDate(value, end = false) {
  return new Date(`${value}T${end ? "23:59:59.999" : "00:00:00"}`);
}

export function money(amount, currency = "PEN", locale = "en-US") {
  try {
    const value = new Money({ amount, currency });
    return new Intl.NumberFormat(canonicalLocale(locale), {
      style: "currency",
      currency: value.currency,
    }).format(value.amount);
  } catch {
    return "—";
  }
}

const errorKeys = new Map([
  ["Failed to load subscription plans", "subscriptions.plans.load-error"],
  [
    "Failed to load current subscription",
    "subscriptions.plans.errors.load-current",
  ],
  ["Failed to create subscription", "subscriptions.plans.errors.create"],
  ["Failed to update subscription", "subscriptions.plans.errors.update"],
  [
    "The user already has an active subscription",
    "subscriptions.plans.errors.active-exists",
  ],
  [
    "The selected plan is not available",
    "subscriptions.plans.errors.unavailable",
  ],
  [
    "There is no active subscription to update",
    "subscriptions.plans.errors.no-current",
  ],
  [
    "The selected plan is already the current plan",
    "subscriptions.plans.errors.same-plan",
  ],
]);

export function subscriptionErrorKey(
  error,
  fallback = "subscriptions.plans.errors.fallback",
) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  if (errorKeys.has(message)) return errorKeys.get(message);
  if (
    /Money (amount|currency)|Date range contains an invalid date|Start date must be/i.test(
      message,
    )
  ) {
    return "subscriptions.plans.errors.invalid-data";
  }
  return fallback;
}
