import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint.js';
import { environment } from '../../../environments/environment.js';

import { RentalRequestAssembler } from './rental-request-assembler.js';
export class RentalRequestApiEndpoint extends BaseApiEndpoint {
  constructor(http) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderRentalRequestsEndpointPath}`,
      new RentalRequestAssembler(),
    );
  }
}
