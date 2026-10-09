import { Maintenance } from '../domain/model/maintenance.entity.js';
export class MaintenanceAssembler {
  toEntitiesFromResponse(response) {
    return response.maintenances.map((resource) => this.toEntityFromResource(resource));
  }
  toEntityFromResource(resource) {
    return new Maintenance({
      id: resource.id,
      equipmentId: resource.equipmentId,
      performedAt: new Date(resource.performedAt),
      type: resource.type,
      status: resource.status,
    });
  }
  toResourceFromEntity(entity) {
    return {
      id: entity.id,
      equipmentId: entity.equipmentId,
      performedAt: entity.performedAt.toISOString(),
      type: entity.type,
      status: entity.status,
    };
  }
}
