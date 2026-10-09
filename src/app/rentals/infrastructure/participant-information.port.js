/**
 * @typedef {object} RentalParticipantInformation
 * @property {number} userId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} companyName
 */

/**
 * @typedef {object} ParticipantInformationPort
 * @property {Function} getParticipantInformationByUserIds - getParticipantInformationByUserIds(userIds)
 */
export const PARTICIPANT_INFORMATION_PORT = Symbol('PARTICIPANT_INFORMATION_PORT');
