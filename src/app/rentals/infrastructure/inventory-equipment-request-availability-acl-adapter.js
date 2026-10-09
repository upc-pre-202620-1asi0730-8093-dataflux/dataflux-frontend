import { HttpClient, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';

export class InventoryEquipmentRequestAvailabilityAclAdapter extends ErrorHandlingEnabledBaseType {
  #http = resolve(HttpClient);
  #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}`;
  assertAvailableForRequest(equipmentId, rentalCompanyUserId, startDate, endDate) {
    if (
      !Number.isInteger(equipmentId) ||
      equipmentId <= 0 ||
      !Number.isInteger(rentalCompanyUserId) ||
      rentalCompanyUserId <= 0 ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate > endDate
    ) {
      return throwError(() => new Error('Invalid equipment, company or rental period'));
    }
    return this.#http.get(`${this.#endpointUrl}/${equipmentId}`).pipe(
      catchError(this.handleError('Failed to check current equipment availability')),
      map((equipment) => {
        if (!equipment || equipment.id !== equipmentId) {
          throw new Error('Equipment not found');
        }
        if (equipment.userId !== rentalCompanyUserId) {
          throw new Error('Equipment does not belong to the requested rental company');
        }
        if (equipment.status !== 'AVAILABLE') {
          throw new Error('Equipment is not available: its operational status has changed');
        }
        if (
          equipment.availabilityBlocks !== undefined &&
          !Array.isArray(equipment.availabilityBlocks)
        ) {
          throw new Error('Unable to verify equipment reservations');
        }
        const reserved = (equipment.availabilityBlocks ?? []).some((block) => {
          const blockedStart = new Date(block.startDate);
          const blockedEnd = new Date(block.endDate);
          if (
            Number.isNaN(blockedStart.getTime()) ||
            Number.isNaN(blockedEnd.getTime()) ||
            blockedStart > blockedEnd
          ) {
            throw new Error('Unable to verify equipment reservations');
          }
          return startDate <= blockedEnd && blockedStart <= endDate;
        });
        if (reserved) {
          throw new Error('Equipment is already reserved for the selected period');
        }
        return undefined;
      }),
    );
  }
}
