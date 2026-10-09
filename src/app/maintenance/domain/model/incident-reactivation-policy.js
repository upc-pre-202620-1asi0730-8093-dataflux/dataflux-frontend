import { IncidentStatus } from './incident-status.enum.js';
export class IncidentReactivationPolicy {
  static canReactivate(equipmentId, incidents) {
    const related = incidents.filter((incident) => incident.equipmentId === equipmentId);
    const hadBlockingIncident = related.some((incident) => incident.blocksRental);
    const hasUnresolvedBlocker = related.some(
      (incident) => incident.blocksRental && incident.status === IncidentStatus.OPEN,
    );
    return hadBlockingIncident && !hasUnresolvedBlocker;
  }
}
