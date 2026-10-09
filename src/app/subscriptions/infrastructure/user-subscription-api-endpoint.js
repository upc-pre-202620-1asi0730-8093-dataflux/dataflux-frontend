import { environment } from '../../../environments/environment.js';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint.js';

import { UserSubscriptionAssembler } from './user-subscription-assembler.js';
export class UserSubscriptionApiEndpoint extends BaseApiEndpoint {
  constructor(http) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}/user-subscriptions`,
      new UserSubscriptionAssembler(),
    );
  }
}
