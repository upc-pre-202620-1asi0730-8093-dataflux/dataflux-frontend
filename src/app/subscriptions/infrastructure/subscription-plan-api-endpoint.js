import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint.js';
import { environment } from '../../../environments/environment.js';

import { SubscriptionPlanAssembler } from './subscription-plan-assembler.js';
export class SubscriptionPlanApiEndpoint extends BaseApiEndpoint {
  constructor(http) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderSubscriptionPlansEndpointPath}`,
      new SubscriptionPlanAssembler(),
    );
  }
}
