/**
 * @typedef {object} EquipmentOperationPort
 * @property {Function} reservePeriod - reservePeriod(equipmentId, startDate, endDate)
 * @property {Function} markAsRented - markAsRented(equipmentId)
 * @property {Function} markAsAvailable - markAsAvailable(equipmentId)
 * @property {Function} markAsMaintenance - markAsMaintenance(equipmentId)
 */
export const EQUIPMENT_OPERATION_PORT = Symbol('EQUIPMENT_OPERATION_PORT');
