import { Money } from '../../shared/domain/value-object/money.value-object.js';
import { SubscriptionPlan } from '../domain/model/subscription-plan.entity.js';
export class SubscriptionPlanAssembler {
  toEntitiesFromResponse(response) {
    return response.subscriptionPlans.map((resource) => this.toEntityFromResource(resource));
  }
  toEntityFromResource(resource) {
    return new SubscriptionPlan({
      id: resource.id,
      name: resource.name,
      description: resource.description,
      price: new Money({
        amount: resource.priceAmount,
        currency: resource.priceCurrency,
      }),
      billingCycle: resource.billingCycle,
      status: resource.status,
    });
  }
  toResourceFromEntity(entity) {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      priceAmount: entity.price.amount,
      priceCurrency: entity.price.currency,
      billingCycle: entity.billingCycle,
      status: entity.status,
    };
  }
}
