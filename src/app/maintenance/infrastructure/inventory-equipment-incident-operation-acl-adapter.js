import { FetchClient, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';

export class InventoryEquipmentIncidentOperationAclAdapter extends ErrorHandlingEnabledBaseType {
  #http = resolve(FetchClient);
  #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}`;
  markAsMaintenance(userId, equipmentId) {
    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !Number.isInteger(equipmentId) ||
      equipmentId <= 0
    ) {
      return throwError(() => new Error('Invalid company or equipment identifier'));
    }
    const url = `${this.#endpointUrl}/${equipmentId}`;
    return this.#http.get(url).pipe(
      switchMap((equipment) => {
        if (!equipment || equipment.id !== equipmentId || equipment.userId !== userId) {
          return throwError(() => new Error('Equipment does not belong to this company'));
        }
        if (equipment.status === 'RENTED') {
          return throwError(
            () => new Error('Rented equipment cannot be automatically marked as maintenance'),
          );
        }
        if (equipment.status === 'MAINTENANCE') {
          return of('ALREADY_UNAVAILABLE');
        }
        if (equipment.status !== 'AVAILABLE') {
          return throwError(() => new Error('Equipment status does not allow this operation'));
        }
        return this.#http
          .patch(url, {
            status: 'MAINTENANCE',
          })
          .pipe(map(() => 'CHANGED'));
      }),
      catchError(this.handleError('Failed to mark equipment as maintenance')),
    );
  }
  reactivateEquipment(userId, equipmentId) {
    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !Number.isInteger(equipmentId) ||
      equipmentId <= 0
    ) {
      return throwError(() => new Error('Invalid company or equipment identifier'));
    }
    const url = `${this.#endpointUrl}/${equipmentId}`;
    return this.#http.get(url).pipe(
      switchMap((equipment) => {
        if (!equipment || equipment.id !== equipmentId || equipment.userId !== userId) {
          return throwError(() => new Error('Equipment does not belong to this company'));
        }
        if (equipment.status !== 'MAINTENANCE') {
          return throwError(() => new Error('Only equipment in MAINTENANCE can be reactivated'));
        }
        return this.#http
          .patch(url, {
            status: 'AVAILABLE',
          })
          .pipe(map(() => undefined));
      }),
      catchError(this.handleError('Failed to reactivate equipment')),
    );
  }
}
