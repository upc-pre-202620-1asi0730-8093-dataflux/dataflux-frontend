/**
 * @typedef {object} SubscriptionAccessPort
 * @property {Function} hasActiveSubscription - hasActiveSubscription(userId)
 * @property {Function} canManageRentals - canManageRentals(userId)
 */
export const SUBSCRIPTION_ACCESS_PORT = Symbol('SUBSCRIPTION_ACCESS_PORT');
