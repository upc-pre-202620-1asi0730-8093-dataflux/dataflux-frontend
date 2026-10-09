import { HttpClient, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';

export class SubscriptionMaintenanceAccessAclAdapter extends ErrorHandlingEnabledBaseType {
  #http = resolve(HttpClient);
  #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderUserSubscriptionsEndpointPath}`;
  canRegisterMaintenance(userId) {
    return this.#http.get(this.#endpointUrl).pipe(
      map((subscriptions) =>
        subscriptions.some(
          (subscription) =>
            subscription.userId === userId &&
            subscription.planId === 3 &&
            subscription.status === 'ACTIVE' &&
            this.#isWithinPeriod(subscription.startDate, subscription.endDate),
        ),
      ),
      catchError(this.handleError('Failed to verify maintenance subscription access')),
    );
  }
  #isWithinPeriod(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return false;
    }
    const now = new Date();
    return startDate <= now && now <= endDate;
  }
}
