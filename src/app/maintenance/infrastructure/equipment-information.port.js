/**
 * @typedef {object} MaintenanceEquipmentInformation
 * @property {number} id
 * @property {number} ownerUserId
 * @property {string} code
 * @property {string} name
 * @property {MaintenanceEquipmentOperationalStatus} [status]
 */

/**
 * @typedef {object} EquipmentInformationPort
 * @property {Function} getEquipmentInformationByUserId - getEquipmentInformationByUserId(userId)
 */
export const MAINTENANCE_EQUIPMENT_INFORMATION_PORT = Symbol(
  'MAINTENANCE_EQUIPMENT_INFORMATION_PORT',
);
