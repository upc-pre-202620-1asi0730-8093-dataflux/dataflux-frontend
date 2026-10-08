import { FetchClient, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';

export class InventoryEquipmentInformationAclAdapter extends ErrorHandlingEnabledBaseType {
  #http = resolve(FetchClient);
  #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}`;
  getEquipmentInformationByIds(equipmentIds) {
    const requestedIds = new Set(equipmentIds);
    return this.#http.get(this.#endpointUrl).pipe(
      map((response) => {
        const resources = Array.isArray(response) ? response : response.equipments;
        return resources
          .filter((resource) => requestedIds.has(resource.id))
          .map((resource) => ({
            id: resource.id,
            code: resource.code,
            name: resource.name,
          }));
      }),
      catchError(this.handleError('Failed to fetch equipment information')),
    );
  }
}
