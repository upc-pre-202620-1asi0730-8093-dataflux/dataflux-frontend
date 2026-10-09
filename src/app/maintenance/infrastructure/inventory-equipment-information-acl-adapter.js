import { HttpClient, QueryParams, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';

export class InventoryEquipmentInformationAclAdapter extends ErrorHandlingEnabledBaseType {
  #http = resolve(HttpClient);
  #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}`;
  getEquipmentInformationByUserId(userId) {
    const params = new QueryParams().set('userId', userId.toString());
    return this.#http
      .get(this.#endpointUrl, {
        params,
      })
      .pipe(
        map((response) => {
          const resources = Array.isArray(response) ? response : response.equipments;
          return resources.map((resource) => ({
            id: resource.id,
            ownerUserId: resource.userId,
            code: resource.code,
            name: resource.name,
            status: resource.status,
          }));
        }),
        catchError(this.handleError('Failed to fetch equipment information for maintenance')),
      );
  }
}
