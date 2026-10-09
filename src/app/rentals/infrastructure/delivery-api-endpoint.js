import { environment } from '../../../environments/environment.js';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint.js';

import { DeliveryAssembler } from './delivery-assembler.js';
export class DeliveryApiEndpoint extends BaseApiEndpoint {
  constructor(http) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderDeliveriesEndpointPath}`,
      new DeliveryAssembler(),
    );
  }
}
