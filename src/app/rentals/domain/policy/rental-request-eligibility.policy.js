import { RentalStatus } from '../model/rental-status.enum.js';
export class RentalRequestEligibilityPolicy {
  static ensureNoOverlappingCommittedRental(request, rentals) {
    const hasConflict = rentals.some(
      (rental) =>
        rental.equipmentId === request.equipmentId &&
        (rental.status === RentalStatus.CONFIRMED || rental.status === RentalStatus.ACTIVE) &&
        rental.period.overlaps(request.period),
    );
    if (hasConflict) {
      throw new Error('Equipment already has a confirmed or active rental for the selected period');
    }
  }
}
