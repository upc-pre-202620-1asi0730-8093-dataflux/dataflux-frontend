import { Delivery } from '../domain/model/delivery.entity.js';
export class DeliveryAssembler {
  toEntitiesFromResponse(response) {
    return response.deliveries.map((resource) => this.toEntityFromResource(resource));
  }
  toEntityFromResource(resource) {
    return new Delivery({
      id: resource.id,
      rentalId: resource.rentalId,
      deliveredAt: new Date(resource.deliveredAt),
      notes: resource.notes,
    });
  }
  toResourceFromEntity(entity) {
    return {
      id: entity.id,
      rentalId: entity.rentalId,
      deliveredAt: entity.deliveredAt.toISOString(),
      notes: entity.notes,
    };
  }
}
