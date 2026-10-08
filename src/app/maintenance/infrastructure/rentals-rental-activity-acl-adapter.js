import { FetchClient, QueryParams, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';

export class RentalsRentalActivityAclAdapter extends ErrorHandlingEnabledBaseType {
  #http = resolve(FetchClient);
  #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderRentalsEndpointPath}`;
  hasActiveRental(equipmentId) {
    if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
      return throwError(() => new Error('Invalid equipment identifier'));
    }
    const params = new QueryParams().set('equipmentId', equipmentId.toString());
    return this.#http
      .get(this.#endpointUrl, {
        params,
      })
      .pipe(
        map((response) => {
          const rentals = Array.isArray(response) ? response : response.rentals;
          if (!Array.isArray(rentals)) {
            throw new Error('Invalid rentals response');
          }
          return rentals.some(
            (rental) => rental.equipmentId === equipmentId && rental.status === 'ACTIVE',
          );
        }),
        catchError(this.handleError('Failed to check active rentals')),
      );
  }
}
