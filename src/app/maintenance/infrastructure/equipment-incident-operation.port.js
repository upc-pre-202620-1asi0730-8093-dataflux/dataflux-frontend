/**
 * @typedef {object} EquipmentIncidentOperationPort
 * @property {Function} markAsMaintenance - markAsMaintenance(userId, equipmentId)
 * @property {Function} reactivateEquipment - reactivateEquipment(userId, equipmentId)
 */
export const MAINTENANCE_EQUIPMENT_OPERATION_PORT = Symbol('MAINTENANCE_EQUIPMENT_OPERATION_PORT');
