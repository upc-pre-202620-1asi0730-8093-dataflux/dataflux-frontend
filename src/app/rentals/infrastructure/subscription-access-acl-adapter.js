import { FetchClient, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';

export class SubscriptionAccessAclAdapter extends ErrorHandlingEnabledBaseType {
  #http = resolve(FetchClient);
  #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderUserSubscriptionsEndpointPath}`;
  hasActiveSubscription(userId) {
    return this.#http.get(this.#endpointUrl).pipe(
      map((subscriptions) =>
        subscriptions.some(
          (subscription) => subscription.userId === userId && this.#isActive(subscription),
        ),
      ),
      catchError(this.handleError('Failed to validate subscription access')),
    );
  }
  canManageRentals(userId) {
    return this.#http.get(this.#endpointUrl).pipe(
      map((subscriptions) =>
        subscriptions.some(
          (subscription) =>
            subscription.userId === userId &&
            this.#isActive(subscription) &&
            this.#supportsRentalManagement(subscription),
        ),
      ),
      catchError(this.handleError('Failed to validate rental management access')),
    );
  }
  #supportsRentalManagement(subscription) {
    return subscription.planId === 2 || subscription.planId === 3;
  }
  #isActive(subscription) {
    if (subscription.status !== 'ACTIVE') {
      return false;
    }
    const now = new Date();
    const startDate = new Date(subscription.startDate);
    const endDate = new Date(subscription.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return false;
    }
    return startDate <= now && now <= endDate;
  }
}
