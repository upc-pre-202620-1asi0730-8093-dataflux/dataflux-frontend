import { resolve } from '../../shared/infrastructure/services.js';
import { computed } from 'vue';

import { RentalsStore } from '../../rentals/application/rentals.store.js';
import { RentalRequest } from '../../rentals/domain/model/rental-request.entity.js';

export class RentalsEquipmentRentalRequestAclAdapter {
  #rentals = resolve(RentalsStore);
  loading = this.#rentals.loading;
  error = this.#rentals.error;
  subscriptionRequired = this.#rentals.subscriptionRequired;
  latestCreatedRequest = computed(() => {
    const created = this.#rentals.latestCreatedRequest.value;
    return created
      ? {
          status: created.status,
        }
      : null;
  });
  submitRentalRequest(equipmentId, constructionUserId, rentalCompanyUserId, period) {
    this.#rentals.createRentalRequest(
      new RentalRequest({
        id: 0,
        equipmentId,
        constructionUserId,
        rentalCompanyUserId,
        period,
      }),
    );
  }
  clearCreationState() {
    this.#rentals.clearCreationState();
  }
}
