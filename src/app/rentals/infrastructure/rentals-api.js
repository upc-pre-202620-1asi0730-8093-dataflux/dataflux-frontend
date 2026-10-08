import { BaseApi } from '../../shared/infrastructure/base-api.js';

import { DeliveryApiEndpoint } from './delivery-api-endpoint.js';
import { EquipmentReturnApiEndpoint } from './equipment-return-api-endpoint.js';
import { RentalApiEndpoint } from './rental-api-endpoint.js';
import { RentalRequestApiEndpoint } from './rental-request-api-endpoint.js';
export class RentalsApi extends BaseApi {
  #rentalRequestEndpoint = new RentalRequestApiEndpoint(this.http);
  #rentalEndpoint = new RentalApiEndpoint(this.http);
  #deliveryEndpoint = new DeliveryApiEndpoint(this.http);
  #equipmentReturnEndpoint = new EquipmentReturnApiEndpoint(this.http);
  getRentalRequests() {
    return this.#rentalRequestEndpoint.getAll();
  }
  getRentalRequest(id) {
    return this.#rentalRequestEndpoint.getById(id);
  }
  createRentalRequest(rentalRequest) {
    return this.#rentalRequestEndpoint.create(rentalRequest);
  }
  updateRentalRequest(rentalRequest) {
    return this.#rentalRequestEndpoint.update(rentalRequest, rentalRequest.id);
  }
  getRentals() {
    return this.#rentalEndpoint.getAll();
  }
  createRental(rental) {
    return this.#rentalEndpoint.create(rental);
  }
  updateRental(rental) {
    return this.#rentalEndpoint.update(rental, rental.id);
  }
  createDelivery(delivery) {
    return this.#deliveryEndpoint.create(delivery);
  }
  createEquipmentReturn(equipmentReturn) {
    return this.#equipmentReturnEndpoint.create(equipmentReturn);
  }
}
