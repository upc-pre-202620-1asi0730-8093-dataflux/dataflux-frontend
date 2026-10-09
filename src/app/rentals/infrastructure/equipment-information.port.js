/**
 * @typedef {object} RentalEquipmentInformation
 * @property {number} id
 * @property {string} code
 * @property {string} name
 */

/**
 * @typedef {object} EquipmentInformationPort
 * @property {Function} getEquipmentInformationByIds - getEquipmentInformationByIds(equipmentIds)
 */
export const EQUIPMENT_INFORMATION_PORT = Symbol('EQUIPMENT_INFORMATION_PORT');
