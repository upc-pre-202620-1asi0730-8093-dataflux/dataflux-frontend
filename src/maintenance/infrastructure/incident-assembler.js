import { Incident } from '../domain/model/incident.entity.js';
import { IncidentStatus } from '../domain/model/incident-status.enum.js';
export class IncidentAssembler {
  toEntitiesFromResponse(response) {
    return response.incidents.map((resource) => this.toEntityFromResource(resource));
  }
  toEntityFromResource(resource) {
    const status = resource.status ?? IncidentStatus.OPEN;
    return new Incident({
      id: resource.id,
      equipmentId: resource.equipmentId,
      description: resource.description,
      reportedAt: new Date(resource.reportedAt),
      blocksRental: resource.blocksRental ?? false,
      status,
      resolvedAt: resource.resolvedAt ? new Date(resource.resolvedAt) : null,
    });
  }
  toResourceFromEntity(entity) {
    return {
      id: entity.id,
      equipmentId: entity.equipmentId,
      description: entity.description,
      reportedAt: entity.reportedAt.toISOString(),
      blocksRental: entity.blocksRental,
      status: entity.status,
      resolvedAt: entity.resolvedAt?.toISOString() ?? null,
    };
  }
}
