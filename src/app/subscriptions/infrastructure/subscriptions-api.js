import { BaseApi } from '../../shared/infrastructure/base-api.js';

import { SubscriptionPlanApiEndpoint } from './subscription-plan-api-endpoint.js';
import { UserSubscriptionApiEndpoint } from './user-subscription-api-endpoint.js';
export class SubscriptionsApi extends BaseApi {
  #subscriptionPlanEndpoint = new SubscriptionPlanApiEndpoint(this.http);
  #userSubscriptionEndpoint = new UserSubscriptionApiEndpoint(this.http);
  getSubscriptionPlans() {
    return this.#subscriptionPlanEndpoint.getAll();
  }
  getUserSubscriptions() {
    return this.#userSubscriptionEndpoint.getAll();
  }
  createUserSubscription(subscription) {
    return this.#userSubscriptionEndpoint.create(subscription);
  }
  updateUserSubscription(subscription) {
    return this.#userSubscriptionEndpoint.update(subscription, subscription.id);
  }
}
