import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint.js';
import { environment } from '../../../environments/environment.js';

import { RentalAssembler } from './rental-assembler.js';
export class RentalApiEndpoint extends BaseApiEndpoint {
  constructor(http) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderRentalsEndpointPath}`,
      new RentalAssembler(),
    );
  }
}
