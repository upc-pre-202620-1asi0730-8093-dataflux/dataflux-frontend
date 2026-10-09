import { catchError, concatMap, defer, from, map, of, switchMap, tap, throwError, toArray } from 'rxjs';
import { RentalRequestStatus } from '../domain/model/rental-request-status.enum.js';

export class RentalOperations {
  #api;
  #equipment;
  #incidents;
  constructor({ rentalsApi, equipmentOperation, incidentRestriction }) {
    this.#api = rentalsApi;
    this.#equipment = equipmentOperation;
    this.#incidents = incidentRestriction;
  }
  approve(request, confirmedRental) {
    return this.#recover((compensations) => this.#api.getRentalRequest(request.id).pipe(
      switchMap((current) => {
        this.#ensureSameRental(current, request);
        if (current.status === RentalRequestStatus.APPROVED) return of(current);
        if (!current.isPending) throw new Error('Rental request is no longer pending; reload requests');
        return this.#incidents.hasOpenBlockingIncident(request.equipmentId).pipe(
          switchMap((blocked) => {
            if (blocked) throw new Error('Equipment has an open blocking maintenance incident');
            return this.#equipment.reservePeriod(request.equipmentId,
              request.period.startDate, request.period.endDate, request.id);
          }),
          tap((receipt) => compensations.push(() => this.#equipment.releaseReservation(receipt))),
          switchMap(() => this.#api.createRental(confirmedRental)),
          tap((rental) => compensations.push(() => this.#api.removeConfirmedRental(rental))),
          switchMap(() => this.#api.updateRentalRequest(request)),
        );
      }),
    ));
  }
  deliver(current, updated, delivery) {
    return this.#move(current, updated, () => this.#equipment.markAsRented(current.equipmentId),
      () => this.#api.createDelivery(delivery));
  }
  returnEquipment(current, updated, equipmentReturn) {
    const updateEquipment = () => equipmentReturn.requiresMaintenance()
      ? this.#equipment.markAsMaintenance(current.equipmentId)
      : this.#equipment.markAsAvailable(current.equipmentId);
    return this.#move(current, updated, updateEquipment,
      () => this.#api.createEquipmentReturn(equipmentReturn));
  }
  #move(current, updated, updateEquipment, recordOperation) {
    return this.#recover((compensations) => this.#api.getRental(current.id).pipe(
      switchMap((fresh) => {
        this.#ensureSameRental(fresh, current);
        if (![current.status, updated.status].includes(fresh.status)) {
          throw new Error('Rental status changed; reload rentals before retry');
        }
        return updateEquipment().pipe(
          tap((receipt) => compensations.push(() => this.#equipment.restoreStatus(receipt))),
          switchMap(() => {
            if (fresh.status === updated.status) return of(fresh);
            return this.#api.updateRental(updated).pipe(
              tap((saved) => compensations.push(() => this.#api.restoreRental(fresh, saved))),
            );
          }),
          switchMap((saved) => recordOperation().pipe(map(() => saved))),
        );
      }),
    ));
  }
  #recover(operation) {
    return defer(() => {
      const compensations = [];
      return operation(compensations).pipe(catchError((error) => {
        if (error.outcomeUnknown) return throwError(() => error);
        // Stop on a failed compensation: releasing availability while a rental
        // could still exist would introduce another inconsistent state.
        return from([...compensations].reverse()).pipe(
          concatMap((compensate) => defer(compensate)), toArray(),
          catchError((recoveryError) => of(recoveryError)),
          switchMap((result) => throwError(() => Array.isArray(result) ? error : new Error(
            `${error.message}. Recovery incomplete: ${result.message}. Inspect before retry`,
          ))),
        );
      }));
    });
  }
  #ensureSameRental(actual, expected) {
    if (actual.id !== expected.id || actual.equipmentId !== expected.equipmentId ||
      actual.constructionUserId !== expected.constructionUserId ||
      actual.rentalCompanyUserId !== expected.rentalCompanyUserId ||
      (actual.rentalRequestId ?? null) !== (expected.rentalRequestId ?? null) ||
      actual.period.startDate.getTime() !== expected.period.startDate.getTime() ||
      actual.period.endDate.getTime() !== expected.period.endDate.getTime()) {
      throw new Error('Rental details changed; reload before retry');
    }
  }
}
