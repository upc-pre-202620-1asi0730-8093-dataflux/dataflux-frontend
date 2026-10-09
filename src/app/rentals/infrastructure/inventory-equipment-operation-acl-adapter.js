import { HttpClient, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';
import { MAINTENANCE_INCIDENT_RESTRICTION_PORT } from './maintenance-incident-restriction.port.js';
import { verifyRentalWrite } from './rental-write-recovery.js';

export class InventoryEquipmentOperationAclAdapter extends ErrorHandlingEnabledBaseType {
  #http = resolve(HttpClient);
  #incidentRestriction = resolve(MAINTENANCE_INCIDENT_RESTRICTION_PORT);
  #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}`;
  reservePeriod(equipmentId, startDate, endDate, rentalRequestId = null) {
    if (
      !(startDate instanceof Date) || !(endDate instanceof Date) ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate > endDate
    ) {
      throw new Error('Rental period is invalid');
    }
    if (rentalRequestId !== null && (!Number.isInteger(rentalRequestId) || rentalRequestId <= 0)) {
      throw new Error('Invalid rental request identifier');
    }
    return this.#http.get(`${this.#endpointUrl}/${equipmentId}`).pipe(
      switchMap((equipment) => {
        if (equipment.status !== 'AVAILABLE') {
          throw new Error('Equipment is not available');
        }
        const availabilityBlocks = this.#blocks(equipment);
        const owned = rentalRequestId === null ? [] : availabilityBlocks.filter(
          (block) => block.rentalRequestId === rentalRequestId,
        );
        if (owned.length > 1 || (owned.length === 1 &&
          !this.#samePeriod(owned[0], startDate, endDate))) {
          throw new Error('Conflicting reservation for this request; inspect before retry');
        }
        const overlaps = availabilityBlocks.some((block) => block !== owned[0] &&
          this.#periodsOverlap(
            startDate,
            endDate,
            new Date(block.startDate),
            new Date(block.endDate),
          ),
        );
        if (overlaps) {
          throw new Error('Equipment is not available for the selected period');
        }
        const block = owned[0] ?? {
          id: availabilityBlocks.reduce((highest, item) => Math.max(highest, item.id), 0) + 1,
          startDate: startDate.toISOString(), endDate: endDate.toISOString(),
          ...(rentalRequestId === null ? {} : { rentalRequestId }),
        };
        const receipt = { equipmentId, id: block.id, rentalRequestId: block.rentalRequestId ?? null,
          startDate: block.startDate, endDate: block.endDate };
        if (owned[0]) return of(receipt);
        return this.#patchVerified(equipmentId, {
          availabilityBlocks: [...availabilityBlocks, block],
        }, (actual) => this.#blocks(actual).some((item) => this.#sameReservation(item, receipt)))
          .pipe(map(() => receipt));
      }),
      catchError((error) => this.#handleOperationError(error, 'Failed to reserve equipment period')),
    );
  }
  releaseReservation(receipt) {
    return this.#http.get(`${this.#endpointUrl}/${receipt.equipmentId}`).pipe(
      switchMap((equipment) => {
        const blocks = this.#blocks(equipment);
        const owned = blocks.find((block) => block.id === receipt.id);
        if (!owned) return of(undefined);
        if (!this.#sameReservation(owned, receipt)) {
          throw new Error('Reservation changed before compensation; inspect before retry');
        }
        return this.#patchVerified(receipt.equipmentId, {
          availabilityBlocks: blocks.filter((block) => block !== owned),
        }, (actual) => !this.#blocks(actual).some((block) => block.id === receipt.id))
          .pipe(map(() => undefined));
      }),
    );
  }
  markAsRented(equipmentId) {
    return this.#updateStatus(equipmentId, 'RENTED');
  }
  markAsAvailable(equipmentId) {
    return this.#updateStatus(equipmentId, 'AVAILABLE');
  }
  markAsMaintenance(equipmentId) {
    return this.#updateStatus(equipmentId, 'MAINTENANCE');
  }
  restoreStatus(receipt) {
    if (!receipt.changed) return of(undefined);
    return this.#http.get(`${this.#endpointUrl}/${receipt.equipmentId}`).pipe(
      switchMap((equipment) => {
        if (equipment.status === receipt.previousStatus) return of(undefined);
        if (equipment.status !== receipt.appliedStatus) {
          throw new Error('Equipment changed before compensation; inspect before retry');
        }
        return this.#incidentRestriction.hasOpenBlockingIncident(receipt.equipmentId).pipe(
          switchMap((blocked) => {
            if (blocked && receipt.previousStatus !== 'MAINTENANCE') {
              throw new Error('Blocking incident prevents equipment compensation; inspect before retry');
            }
            return this.#patchVerified(receipt.equipmentId, { status: receipt.previousStatus },
              (actual) => actual.status === receipt.previousStatus);
          }),
          map(() => undefined),
        );
      }),
    );
  }
  #updateStatus(equipmentId, status) {
    return this.#http.get(`${this.#endpointUrl}/${equipmentId}`).pipe(
      switchMap((equipment) => {
        if (status === 'RENTED' && !['AVAILABLE', 'RENTED'].includes(equipment.status)) {
          throw new Error('Cannot rent equipment that is not available');
        }
        if (status === 'AVAILABLE' && equipment.status === 'MAINTENANCE') {
          throw new Error('Maintenance equipment must be reactivated through Maintenance');
        }
        if (status === 'AVAILABLE') {
          return this.#incidentRestriction.hasOpenBlockingIncident(equipmentId).pipe(
            switchMap((blocked) => this.#applyStatus(
              equipmentId, equipment.status, blocked ? 'MAINTENANCE' : 'AVAILABLE',
            )),
          );
        }
        return this.#applyStatus(equipmentId, equipment.status, status);
      }),
      catchError((error) => this.#handleOperationError(error, 'Failed to update equipment status')),
    );
  }
  #applyStatus(equipmentId, previousStatus, appliedStatus) {
    const receipt = { equipmentId, previousStatus, appliedStatus, changed: previousStatus !== appliedStatus };
    if (!receipt.changed) return of(receipt);
    return this.#patchVerified(equipmentId, { status: appliedStatus },
      (actual) => actual.status === appliedStatus).pipe(map(() => receipt));
  }
  #patchVerified(equipmentId, body, matches) {
    return this.#http.patch(`${this.#endpointUrl}/${equipmentId}`, body).pipe(
      catchError((error) => verifyRentalWrite(error,
        () => this.#http.get(`${this.#endpointUrl}/${equipmentId}`), matches)),
    );
  }
  #handleOperationError(error, operation) {
    return error.outcomeUnknown ? throwError(() => error) : this.handleError(operation)(error);
  }
  #blocks(equipment) {
    const blocks = equipment.availabilityBlocks ?? [];
    if (!Array.isArray(blocks) || blocks.some((block) =>
      !Number.isInteger(block.id) || block.id <= 0 ||
      (block.rentalRequestId != null && (!Number.isInteger(block.rentalRequestId) || block.rentalRequestId <= 0)) ||
      !Number.isFinite(Date.parse(block.startDate)) || !Number.isFinite(Date.parse(block.endDate)) ||
      new Date(block.startDate) > new Date(block.endDate))) {
      throw new Error('Unable to verify equipment reservations');
    }
    return blocks;
  }
  #sameReservation(block, receipt) {
    return block.id === receipt.id &&
      (block.rentalRequestId ?? null) === (receipt.rentalRequestId ?? null) &&
      this.#samePeriod(block, new Date(receipt.startDate), new Date(receipt.endDate));
  }
  #samePeriod(block, startDate, endDate) {
    return Date.parse(block.startDate) === startDate.getTime() && Date.parse(block.endDate) === endDate.getTime();
  }
  #periodsOverlap(firstStart, firstEnd, secondStart, secondEnd) {
    return firstStart <= secondEnd && secondStart <= firstEnd;
  }
}
