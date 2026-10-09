import { DateRange } from '../domain/value-object/date-range.value-object.js';
import { UserSubscription } from '../domain/model/user-subscription.entity.js';
export class UserSubscriptionAssembler {
  toEntitiesFromResponse(response) {
    return response.userSubscriptions.map((resource) => this.toEntityFromResource(resource));
  }
  toEntityFromResource(resource) {
    return new UserSubscription({
      id: resource.id,
      userId: resource.userId,
      planId: resource.planId,
      period: new DateRange({
        startDate: new Date(resource.startDate),
        endDate: new Date(resource.endDate),
      }),
      status: resource.status,
      autoRenew: resource.autoRenew,
    });
  }
  toResourceFromEntity(entity) {
    return {
      id: entity.id,
      userId: entity.userId,
      planId: entity.planId,
      startDate: entity.period.startDate.toISOString(),
      endDate: entity.period.endDate.toISOString(),
      status: entity.status,
      autoRenew: entity.autoRenew,
    };
  }
}
