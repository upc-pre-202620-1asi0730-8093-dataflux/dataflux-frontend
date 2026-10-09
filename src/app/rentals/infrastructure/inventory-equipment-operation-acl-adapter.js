import { HttpClient, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';
import { MAINTENANCE_INCIDENT_RESTRICTION_PORT } from './maintenance-incident-restriction.port.js';

export class InventoryEquipmentOperationAclAdapter extends ErrorHandlingEnabledBaseType {
  #http = resolve(HttpClient);
  #incidentRestriction = resolve(MAINTENANCE_INCIDENT_RESTRICTION_PORT);
  #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}`;
  reservePeriod(equipmentId, startDate, endDate) {
    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate > endDate
    ) {
      throw new Error('Rental period is invalid');
    }
    return this.#http.get(`${this.#endpointUrl}/${equipmentId}`).pipe(
      switchMap((equipment) => {
        if (equipment.status !== 'AVAILABLE') {
          throw new Error('Equipment is not available');
        }
        const availabilityBlocks = equipment.availabilityBlocks ?? [];
        const overlaps = availabilityBlocks.some((block) =>
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
        const nextBlockId =
          availabilityBlocks.reduce((highestId, block) => Math.max(highestId, block.id), 0) + 1;
        return this.#http.patch(`${this.#endpointUrl}/${equipmentId}`, {
          availabilityBlocks: [
            ...availabilityBlocks,
            {
              id: nextBlockId,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          ],
        });
      }),
      map(() => undefined),
      catchError(this.handleError('Failed to reserve equipment period')),
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
  #updateStatus(equipmentId, status) {
    return this.#http.get(`${this.#endpointUrl}/${equipmentId}`).pipe(
      switchMap((equipment) => {
        if (status === 'RENTED' && equipment.status !== 'AVAILABLE') {
          throw new Error('Cannot rent equipment that is not available');
        }
        if (status === 'AVAILABLE' && equipment.status === 'MAINTENANCE') {
          throw new Error('Maintenance equipment must be reactivated through Maintenance');
        }
        if (status === 'AVAILABLE') {
          return this.#incidentRestriction.hasOpenBlockingIncident(equipmentId).pipe(
            switchMap((blocked) =>
              this.#http.patch(`${this.#endpointUrl}/${equipmentId}`, {
                status: blocked ? 'MAINTENANCE' : 'AVAILABLE',
              }),
            ),
          );
        }
        return this.#http.patch(`${this.#endpointUrl}/${equipmentId}`, {
          status,
        });
      }),
      map(() => undefined),
      catchError(this.handleError('Failed to update equipment status')),
    );
  }
  #periodsOverlap(firstStart, firstEnd, secondStart, secondEnd) {
    return firstStart <= secondEnd && secondStart <= firstEnd;
  }
}
