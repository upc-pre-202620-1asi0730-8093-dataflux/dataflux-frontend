/**
 * @typedef {object} InventoryAccessPort
 * @property {Function} canManageInventory - canManageInventory(userId)
 * @property {Function} getActiveProviderUserIds - getActiveProviderUserIds()
 */
export const INVENTORY_ACCESS_PORT = Symbol('INVENTORY_ACCESS_PORT');
