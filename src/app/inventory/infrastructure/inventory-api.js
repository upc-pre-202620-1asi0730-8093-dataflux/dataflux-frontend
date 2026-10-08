import { BaseApi } from '../../shared/infrastructure/base-api.js';

import { EquipmentApiEndpoint } from './equipment-api-endpoint.js';
import { EquipmentCategoriesApiEndpoint } from './equipment-categories-api-endpoint.js';
export class InventoryApi extends BaseApi {
  #equipmentEndpoint = new EquipmentApiEndpoint(this.http);
  #categoriesEndpoint = new EquipmentCategoriesApiEndpoint(this.http);
  getEquipment() {
    return this.#equipmentEndpoint.getAll();
  }
  getEquipmentByUserId(userId) {
    return this.#equipmentEndpoint.getByUserId(userId);
  }
  getEquipmentById(id) {
    return this.#equipmentEndpoint.getById(id);
  }
  createEquipment(equipment) {
    return this.#equipmentEndpoint.create(equipment);
  }
  updateEquipment(equipment) {
    return this.#equipmentEndpoint.patchEditableFields(equipment);
  }
  getCategories() {
    return this.#categoriesEndpoint.getAll();
  }
}
