/**
 * @typedef {object} EquipmentOperationPort
 * @property {Function} reservePeriod - reservePeriod(equipmentId, startDate, endDate, rentalRequestId), returns its reservation receipt
 * @property {Function} releaseReservation - releaseReservation(receipt), releases only the matching reservation
 * @property {Function} markAsRented - markAsRented(equipmentId)
 * @property {Function} markAsAvailable - markAsAvailable(equipmentId)
 * @property {Function} markAsMaintenance - markAsMaintenance(equipmentId)
 * @property {Function} restoreStatus - restoreStatus(receipt), restores a matching status transition
 */
export const EQUIPMENT_OPERATION_PORT = Symbol('EQUIPMENT_OPERATION_PORT');
