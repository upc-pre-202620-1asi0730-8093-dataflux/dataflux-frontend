import { resolve, sessionEnded } from '../../shared/infrastructure/services.js';
import { shallowRef, shallowReadonly } from 'vue';
import { takeUntil } from 'rxjs';
import { DateRange } from '../../shared/domain/value-object/date-range.value-object.js';
import { PlanStatus } from '../domain/model/plan-status.enum.js';

import { SubscriptionStatus } from '../domain/model/subscription-status.enum.js';
import { UserSubscription } from '../domain/model/user-subscription.entity.js';
import { SubscriptionsApi } from '../infrastructure/subscriptions-api.js';
export class SubscriptionsStore {
  #subscriptionsApi = resolve(SubscriptionsApi);
  #subscriptionRequestVersion = 0;
  #plansState = shallowRef([]);
  plans = shallowReadonly(this.#plansState);
  #currentSubscriptionState = shallowRef(null);
  currentSubscription = shallowReadonly(this.#currentSubscriptionState);
  #loadingState = shallowRef(false);
  loading = shallowReadonly(this.#loadingState);
  #subscriptionLoadingState = shallowRef(false);
  subscriptionLoading = shallowReadonly(this.#subscriptionLoadingState);
  #errorState = shallowRef(null);
  error = shallowReadonly(this.#errorState);
  #subscriptionErrorState = shallowRef(null);
  subscriptionError = shallowReadonly(this.#subscriptionErrorState);
  loadPlans() {
    this.#loadingState.value = true;
    this.#errorState.value = null;
    this.#subscriptionsApi
      .getSubscriptionPlans()
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (plans) => {
          this.#plansState.value = plans.filter((plan) => plan.status === PlanStatus.ACTIVE);
          this.#loadingState.value = false;
          this.#errorState.value = null;
        },
        error: (error) => {
          this.#plansState.value = [];
          this.#errorState.value = this.#formatError(error, 'Failed to load subscription plans');
          this.#loadingState.value = false;
        },
      });
  }
  loadCurrentSubscription(userId) {
    const requestVersion = ++this.#subscriptionRequestVersion;
    this.#currentSubscriptionState.value = null;
    this.#subscriptionLoadingState.value = true;
    this.#subscriptionErrorState.value = null;
    this.#subscriptionsApi
      .getUserSubscriptions()
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (subscriptions) => {
          if (requestVersion !== this.#subscriptionRequestVersion) return;
          const currentSubscription =
            subscriptions.find(
              (subscription) =>
                subscription.userId === userId && subscription.status === SubscriptionStatus.ACTIVE,
            ) ?? null;
          this.#currentSubscriptionState.value = currentSubscription;
          this.#subscriptionLoadingState.value = false;
          this.#subscriptionErrorState.value = null;
        },
        error: (error) => {
          if (requestVersion !== this.#subscriptionRequestVersion) return;
          this.#currentSubscriptionState.value = null;
          this.#subscriptionErrorState.value = this.#formatError(
            error,
            'Failed to load current subscription',
          );
          this.#subscriptionLoadingState.value = false;
        },
      });
  }
  clearCurrentSubscription() {
    ++this.#subscriptionRequestVersion;
    this.#currentSubscriptionState.value = null;
    this.#subscriptionLoadingState.value = false;
    this.#subscriptionErrorState.value = null;
  }
  subscribeToPlan(userId, planId) {
    if (this.#currentSubscriptionState.value) {
      this.#subscriptionErrorState.value = 'The user already has an active subscription';
      return;
    }
    const plan = this.#plansState.value.find((currentPlan) => currentPlan.id === planId);
    if (!plan || plan.status !== PlanStatus.ACTIVE) {
      this.#subscriptionErrorState.value = 'The selected plan is not available';
      return;
    }
    this.#subscriptionLoadingState.value = true;
    this.#subscriptionErrorState.value = null;
    const startDate = new Date();
    const endDate = this.#calculateMonthlyEndDate(startDate);
    const subscription = new UserSubscription({
      id: 0,
      userId,
      planId,
      period: new DateRange({
        startDate,
        endDate,
      }),
      status: SubscriptionStatus.ACTIVE,
      autoRenew: true,
    });
    this.#subscriptionsApi
      .createUserSubscription(subscription)
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (createdSubscription) => {
          this.#currentSubscriptionState.value = createdSubscription;
          this.#subscriptionLoadingState.value = false;
          this.#subscriptionErrorState.value = null;
        },
        error: (error) => {
          this.#subscriptionErrorState.value = this.#formatError(
            error,
            'Failed to create subscription',
          );
          this.#subscriptionLoadingState.value = false;
        },
      });
  }
  changePlan(planId) {
    const currentSubscription = this.#currentSubscriptionState.value;
    if (!currentSubscription) {
      this.#subscriptionErrorState.value = 'There is no active subscription to update';
      return;
    }
    if (currentSubscription.planId === planId) {
      this.#subscriptionErrorState.value = 'The selected plan is already the current plan';
      return;
    }
    const selectedPlan = this.#plansState.value.find((plan) => plan.id === planId);
    if (!selectedPlan || selectedPlan.status !== PlanStatus.ACTIVE) {
      this.#subscriptionErrorState.value = 'The selected plan is not available';
      return;
    }
    this.#subscriptionLoadingState.value = true;
    this.#subscriptionErrorState.value = null;
    const updatedSubscription = new UserSubscription({
      id: currentSubscription.id,
      userId: currentSubscription.userId,
      planId,
      period: currentSubscription.period,
      status: currentSubscription.status,
      autoRenew: currentSubscription.autoRenew,
    });
    this.#subscriptionsApi
      .updateUserSubscription(updatedSubscription)
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (subscription) => {
          this.#currentSubscriptionState.value = subscription;
          this.#subscriptionLoadingState.value = false;
          this.#subscriptionErrorState.value = null;
        },
        error: (error) => {
          this.#subscriptionErrorState.value = this.#formatError(
            error,
            'Failed to update subscription',
          );
          this.#subscriptionLoadingState.value = false;
        },
      });
  }
  #calculateMonthlyEndDate(startDate) {
    const result = new Date(startDate);
    const originalDay = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + 1);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(originalDay, lastDay));
    return result;
  }
  #formatError(error, fallbackMessage) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallbackMessage;
  }
}
