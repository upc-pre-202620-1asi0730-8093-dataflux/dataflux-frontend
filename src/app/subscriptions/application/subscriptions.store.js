import { defineStore } from "pinia";
import { registerStore, exposeStore } from "../../shared/infrastructure/services.js";
import { resolve, sessionEnded } from '../../shared/infrastructure/services.js';
import { shallowRef, shallowReadonly } from 'vue';
import { takeUntil } from 'rxjs';
import { DateRange } from '../domain/value-object/date-range.value-object.js';
import { PlanStatus } from '../domain/model/plan-status.enum.js';

import { SubscriptionStatus } from '../domain/model/subscription-status.enum.js';
import { UserSubscription } from '../domain/model/user-subscription.entity.js';
import { SubscriptionsApi } from '../infrastructure/subscriptions-api.js';
export class SubscriptionsStore {
  #subscriptionsApi = resolve(SubscriptionsApi);
  #subscriptionRequestVersion = 0;
  #planRequestVersion = 0;
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
    const requestVersion = ++this.#planRequestVersion;
    this.#loadingState.value = true;
    this.#errorState.value = null;
    this.#subscriptionsApi
      .getSubscriptionPlans()
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (plans) => {
          if (requestVersion !== this.#planRequestVersion) return;
          this.#plansState.value = plans.filter((plan) => plan.status === PlanStatus.ACTIVE);
          this.#loadingState.value = false;
          this.#errorState.value = null;
        },
        error: (error) => {
          if (requestVersion !== this.#planRequestVersion) return;
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
          const referenceDate = new Date();
          const currentSubscription =
            subscriptions.find(
              (subscription) =>
                subscription.userId === userId && subscription.isActive(referenceDate),
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
  clear() {
    ++this.#planRequestVersion;
    this.#plansState.value = [];
    this.#loadingState.value = false;
    this.#errorState.value = null;
    this.clearCurrentSubscription();
  }
  clearCurrentSubscription() {
    ++this.#subscriptionRequestVersion;
    this.#currentSubscriptionState.value = null;
    this.#subscriptionLoadingState.value = false;
    this.#subscriptionErrorState.value = null;
  }
  subscribeToPlan(userId, planId) {
    if (this.#subscriptionLoadingState.value) return;
    const startDate = new Date();
    if (this.#currentSubscriptionState.value?.isActive(startDate)) {
      this.#subscriptionErrorState.value = 'The user already has an active subscription';
      return;
    }
    const plan = this.#plansState.value.find((currentPlan) => currentPlan.id === planId);
    if (!plan || plan.status !== PlanStatus.ACTIVE) {
      this.#subscriptionErrorState.value = 'The selected plan is not available';
      return;
    }
    const subscription = new UserSubscription({
      id: 0,
      userId,
      planId,
      period: this.#createMonthlyPeriod(startDate),
      status: SubscriptionStatus.ACTIVE,
      autoRenew: true,
    });
    this.#saveSubscription(
      this.#subscriptionsApi.createUserSubscription(subscription),
      'Failed to create subscription',
    );
  }
  changePlan(planId) {
    if (this.#subscriptionLoadingState.value) return;
    const currentSubscription = this.#currentSubscriptionState.value;
    if (!currentSubscription) {
      this.#subscriptionErrorState.value = 'There is no active subscription to update';
      return;
    }
    const referenceDate = new Date();
    const isCurrentPeriodActive = currentSubscription.isActive(referenceDate);
    if (isCurrentPeriodActive && currentSubscription.planId === planId) {
      this.#subscriptionErrorState.value = 'The selected plan is already the current plan';
      return;
    }
    const selectedPlan = this.#plansState.value.find((plan) => plan.id === planId);
    if (!selectedPlan || selectedPlan.status !== PlanStatus.ACTIVE) {
      this.#subscriptionErrorState.value = 'The selected plan is not available';
      return;
    }
    const updatedSubscription = new UserSubscription({
      id: currentSubscription.id,
      userId: currentSubscription.userId,
      planId,
      period: isCurrentPeriodActive
        ? currentSubscription.period
        : this.#createMonthlyPeriod(referenceDate),
      status: SubscriptionStatus.ACTIVE,
      autoRenew: currentSubscription.autoRenew,
    });
    this.#saveSubscription(
      this.#subscriptionsApi.updateUserSubscription(updatedSubscription),
      'Failed to update subscription',
    );
  }
  #saveSubscription(operation$, fallbackMessage) {
    const requestVersion = ++this.#subscriptionRequestVersion;
    this.#subscriptionLoadingState.value = true;
    this.#subscriptionErrorState.value = null;
    operation$
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (subscription) => {
          if (requestVersion !== this.#subscriptionRequestVersion) return;
          this.#currentSubscriptionState.value = subscription;
          this.#subscriptionLoadingState.value = false;
          this.#subscriptionErrorState.value = null;
        },
        error: (error) => {
          if (requestVersion !== this.#subscriptionRequestVersion) return;
          this.#subscriptionErrorState.value = this.#formatError(error, fallbackMessage);
          this.#subscriptionLoadingState.value = false;
        },
      });
  }
  #createMonthlyPeriod(startDate) {
    return new DateRange({ startDate, endDate: this.#calculateMonthlyEndDate(startDate) });
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

export const useSubscriptionsStore = defineStore("subscriptions", () => exposeStore(new SubscriptionsStore()));
registerStore(SubscriptionsStore, useSubscriptionsStore);
