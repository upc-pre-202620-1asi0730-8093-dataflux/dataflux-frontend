/**
 * @typedef {object} EquipmentRentalRequestSummary
 * @property {string} status
 */

/**
 * @typedef {object} EquipmentRentalRequestPort
 * @property {import('vue').Ref} loading
 * @property {import('vue').Ref} error
 * @property {import('vue').Ref} subscriptionRequired
 * @property {import('vue').Ref} latestCreatedRequest
 * @property {Function} submitRentalRequest - submitRentalRequest(equipmentId, constructionUserId, rentalCompanyUserId, period)
 * @property {Function} clearCreationState - clearCreationState()
 */
export const EQUIPMENT_RENTAL_REQUEST_PORT = Symbol('EQUIPMENT_RENTAL_REQUEST_PORT');

