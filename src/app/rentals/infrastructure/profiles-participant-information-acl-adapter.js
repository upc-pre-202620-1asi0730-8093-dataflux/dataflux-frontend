import { HttpClient, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';

export class ProfilesParticipantInformationAclAdapter extends ErrorHandlingEnabledBaseType {
  #http = resolve(HttpClient);
  #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderProfilesEndpointPath}`;
  getParticipantInformationByUserIds(userIds) {
    const requestedIds = new Set(userIds);
    return this.#http.get(this.#endpointUrl).pipe(
      map((response) => {
        const resources = Array.isArray(response) ? response : response.profiles;
        return resources
          .filter((resource) => requestedIds.has(resource.userId))
          .map((resource) => ({
            userId: resource.userId,
            firstName: resource.firstName,
            lastName: resource.lastName,
            companyName: resource.companyName,
          }));
      }),
      catchError(this.handleError('Failed to fetch participant information')),
    );
  }
}
