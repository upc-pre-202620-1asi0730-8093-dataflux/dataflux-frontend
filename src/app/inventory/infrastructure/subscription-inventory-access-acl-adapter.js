import { FetchClient, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';

export class SubscriptionInventoryAccessAclAdapter extends ErrorHandlingEnabledBaseType {
    #http = resolve(FetchClient);
    #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderUserSubscriptionsEndpointPath}`;
    canManageInventory(userId) {
        return this.#getSubscriptions().pipe(
            map((subscriptions) =>
                subscriptions.some(
                    (subscription) => subscription.userId === userId && this.#isActive(subscription),
                ),
            ),
        );
    }
    getActiveProviderUserIds() {
        return this.#getSubscriptions().pipe(
            map((subscriptions) => [
                ...new Set(
                    subscriptions
                        .filter((subscription) => this.#isActive(subscription))
                        .map((subscription) => subscription.userId),
                ),
            ]),
        );
    }
    #getSubscriptions() {
        return this.#http
            .get(this.#endpointUrl)
            .pipe(catchError(this.handleError('Failed to validate inventory access')));
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
