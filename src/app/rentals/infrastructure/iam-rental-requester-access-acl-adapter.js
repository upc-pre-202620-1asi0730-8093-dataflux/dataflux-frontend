import { resolve } from '../../shared/infrastructure/services.js';
import { IamStore } from '../../iam/application/iam.store.js';

export class IamRentalRequesterAccessAclAdapter {
  #iam = resolve(IamStore);
  canSubmitRentalRequest(userId) {
    return (
      Number.isInteger(userId) &&
      userId > 0 &&
      this.#iam.isSignedIn.value &&
      this.#iam.currentUserId.value === userId &&
      this.#iam.currentRole.value === 'construction_company'
    );
  }
}
