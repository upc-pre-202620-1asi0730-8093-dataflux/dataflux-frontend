import { catchError, map, of, switchMap, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { DeliveryApiEndpoint } from './delivery-api-endpoint.js';
import { EquipmentReturnApiEndpoint } from './equipment-return-api-endpoint.js';
import { RentalApiEndpoint } from './rental-api-endpoint.js';
import { RentalRequestApiEndpoint } from './rental-request-api-endpoint.js';
import { matchesRentalResource, verifyRentalWrite } from './rental-write-recovery.js';
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
    return this.#updateVerified(this.#rentalRequestEndpoint, rentalRequest);
  }
  getRentals() {
    return this.#rentalEndpoint.getAll();
  }
  getRental(id) {
    return this.#rentalEndpoint.getById(id);
  }
  createRental(rental) {
    if (rental.rentalRequestId === null) return this.#rentalEndpoint.create(rental);
    return this.#createOnce(this.#rentalEndpoint, rental, 'rentalRequestId');
  }
  updateRental(rental) {
    return this.#updateVerified(this.#rentalEndpoint, rental);
  }
  restoreRental(original, applied) {
    return this.getRental(original.id).pipe(switchMap((current) => {
      if (this.#matches(this.#rentalEndpoint, current, original)) return of(current);
      if (!this.#matches(this.#rentalEndpoint, current, applied)) {
        throw new Error('Rental changed before compensation; inspect before retry');
      }
      return this.updateRental(original);
    }));
  }
  removeConfirmedRental(rental) {
    const endpoint = this.#rentalEndpoint;
    const url = `${endpoint.endpointUrl}/${rental.id}`;
    const read = () => this.http.get(url).pipe(catchError((error) =>
      error.status === 404 ? of(null) : throwError(() => error),
    ));
    return read().pipe(switchMap((current) => {
      if (current === null) return of(undefined);
      const expected = endpoint.assembler.toResourceFromEntity(rental);
      if (current.status !== 'CONFIRMED' || !matchesRentalResource(current, expected)) {
        throw new Error('Rental changed before compensation; inspect before retry');
      }
      return this.http.request('DELETE', url).pipe(
        catchError((error) => verifyRentalWrite(error, read, (actual) => actual === null)),
        map(() => undefined),
      );
    }));
  }
  createDelivery(delivery) {
    return this.#createOnce(this.#deliveryEndpoint, delivery, 'rentalId');
  }
  createEquipmentReturn(equipmentReturn) {
    return this.#createOnce(this.#equipmentReturnEndpoint, equipmentReturn, 'rentalId');
  }
  #updateVerified(endpoint, entity) {
    return endpoint.update(entity, entity.id).pipe(catchError((error) =>
      verifyRentalWrite(error, () => endpoint.getById(entity.id),
        (actual) => this.#matches(endpoint, actual, entity)),
    ));
  }
  #createOnce(endpoint, entity, key) {
    const find = (entities) => this.#findMatching(endpoint, entities, entity, key);
    return endpoint.getAll().pipe(switchMap((entities) => {
      const existing = find(entities);
      if (existing) return of(existing);
      return endpoint.create(entity).pipe(catchError((error) =>
        verifyRentalWrite(error, () => endpoint.getAll(),
          (actual) => Boolean(find(actual))).pipe(map(find)),
      ));
    }));
  }
  #findMatching(endpoint, entities, entity, key) {
    const matching = entities.filter((existing) => existing[key] === entity[key]);
    if (matching.length === 0) return null;
    if (matching.length !== 1 || !this.#matches(endpoint, matching[0], entity)) {
      throw Object.assign(new Error('Recovery incomplete: conflicting rental record; inspect before retry'),
        { outcomeUnknown: true });
    }
    return matching[0];
  }
  #matches(endpoint, actual, expected) {
    return matchesRentalResource(endpoint.assembler.toResourceFromEntity(actual),
      endpoint.assembler.toResourceFromEntity(expected));
  }
}
