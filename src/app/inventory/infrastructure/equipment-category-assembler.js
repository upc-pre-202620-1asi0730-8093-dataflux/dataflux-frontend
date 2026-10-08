import { EquipmentCategory } from '../domain/model/equipment-category.entity.js';
export class EquipmentCategoryAssembler {
  toEntitiesFromResponse(response) {
    return response.categories.map((resource) => this.toEntityFromResource(resource));
  }
  toEntityFromResource(resource) {
    return new EquipmentCategory({
      id: resource.id,
      name: resource.name,
    });
  }
  toResourceFromEntity(entity) {
    return {
      id: entity.id,
      name: entity.name,
    };
  }
}
