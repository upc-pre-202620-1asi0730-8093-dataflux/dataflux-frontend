import { EquipmentReturn } from '../domain/model/equipment-return.entity.js';
export class EquipmentReturnAssembler {
  toEntitiesFromResponse(response) {
    return response.equipmentReturns.map((resource) => this.toEntityFromResource(resource));
  }
  toEntityFromResource(resource) {
    return new EquipmentReturn({
      id: resource.id,
      rentalId: resource.rentalId,
      returnedAt: new Date(resource.returnedAt),
      notes: resource.notes,
      maintenanceRequired: resource.maintenanceRequired,
    });
  }
  toResourceFromEntity(entity) {
    return {
      id: entity.id,
      rentalId: entity.rentalId,
      returnedAt: entity.returnedAt.toISOString(),
      notes: entity.notes,
      maintenanceRequired: entity.maintenanceRequired,
    };
  }
}
