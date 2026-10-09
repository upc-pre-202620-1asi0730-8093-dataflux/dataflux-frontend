import { IncidentStatus } from './incident-status.enum.js';
export class IncidentReactivationPolicy {
  static canReactivate(equipmentId, incidents) {
    const related = incidents.filter((incident) => incident.equipmentId === equipmentId);
    const hasUnresolvedBlocker = related.some(
      (incident) => incident.blocksRental && incident.status === IncidentStatus.OPEN,
    );
    // A maintenance return does not require an incident to have been reported.
    return !hasUnresolvedBlocker;
  }
}
