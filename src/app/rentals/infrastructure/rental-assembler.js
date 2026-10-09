import { DateRange } from '../../shared/domain/value-object/date-range.value-object.js';
import { Rental } from '../domain/model/rental.entity.js';
export class RentalAssembler {
  toEntitiesFromResponse(response) {
    return response.rentals.map((resource) => this.toEntityFromResource(resource));
  }
  toEntityFromResource(resource) {
    return new Rental({
      id: resource.id,
      equipmentId: resource.equipmentId,
      constructionUserId: resource.constructionUserId,
      rentalCompanyUserId: resource.rentalCompanyUserId,
      period: new DateRange({
        startDate: new Date(resource.startDate),
        endDate: new Date(resource.endDate),
      }),
      status: resource.status,
    });
  }
  toResourceFromEntity(entity) {
    return {
      id: entity.id,
      equipmentId: entity.equipmentId,
      constructionUserId: entity.constructionUserId,
      rentalCompanyUserId: entity.rentalCompanyUserId,
      startDate: entity.period.startDate.toISOString(),
      endDate: entity.period.endDate.toISOString(),
      status: entity.status,
    };
  }
}
