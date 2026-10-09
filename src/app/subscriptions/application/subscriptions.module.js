import { resolve } from "../../shared/infrastructure/services.js";
import { SubscriptionsStore } from "./subscriptions.store.js";

export const services = { subscriptions: SubscriptionsStore };
export function clearSession() {
  resolve(SubscriptionsStore).clear();
}
