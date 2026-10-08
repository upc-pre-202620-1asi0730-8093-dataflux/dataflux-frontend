import { QueryParams } from '../../shared/infrastructure/services.js';

import { catchError, map } from 'rxjs/operators';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint.js';
import { environment } from '../../../environments/environment.js';

import { ProfilesAssembler } from './profiles-assembler.js';
export class ProfilesApiEndpoint extends BaseApiEndpoint {
  constructor(http) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderProfilesEndpointPath}`,
      new ProfilesAssembler(),
    );
  }
  getByUserId(userId) {
    const params = new QueryParams().set('userId', userId.toString());
    return this.http
      .get(this.endpointUrl, {
        params,
      })
      .pipe(
        map((response) => {
          const resources = Array.isArray(response) ? response : response.profiles;
          const resource = resources[0];
          return resource ? this.assembler.toEntityFromResource(resource) : undefined;
        }),
        catchError(this.handleError('Failed to fetch profile by user id')),
      );
  }
}
