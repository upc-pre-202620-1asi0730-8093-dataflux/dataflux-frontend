import { FetchClient, QueryParams, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';

export class MaintenanceIncidentRestrictionAclAdapter extends ErrorHandlingEnabledBaseType {
  #http = resolve(FetchClient);
  #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderIncidentsEndpointPath}`;
  hasOpenBlockingIncident(equipmentId) {
    if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
      return throwError(() => new Error('Invalid equipment identifier'));
    }
    const params = new QueryParams().set('equipmentId', equipmentId.toString());
    return this.#http
      .get(this.#endpointUrl, {
        params,
      })
      .pipe(
        catchError(this.handleError('Failed to check maintenance incident restrictions')),
        map((response) => {
          const incidents = Array.isArray(response) ? response : response?.incidents;
          if (!Array.isArray(incidents)) {
            throw new Error('Unable to verify maintenance incidents');
          }
          return incidents.some(
            (incident) =>
              incident.equipmentId === equipmentId &&
              incident.status === 'OPEN' &&
              incident.blocksRental === true,
          );
        }),
      );
  }
}
