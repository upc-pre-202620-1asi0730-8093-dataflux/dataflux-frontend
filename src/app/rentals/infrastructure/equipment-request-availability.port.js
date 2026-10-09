/**
 * @typedef {object} EquipmentRequestAvailabilityPort
 * @property {Function} assertAvailableForRequest - assertAvailableForRequest(equipmentId, rentalCompanyUserId, startDate, endDate)
 */
export const EQUIPMENT_REQUEST_AVAILABILITY_PORT = Symbol('EQUIPMENT_REQUEST_AVAILABILITY_PORT');
