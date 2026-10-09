import { DateRange } from '../../shared/domain/value-object/date-range.value-object.js';
import { RentalRequest } from '../domain/model/rental-request.entity.js';
export class RentalRequestAssembler {
  toEntitiesFromResponse(response) {
    return response.rentalRequests.map((resource) => this.toEntityFromResource(resource));
  }
  toEntityFromResource(resource) {
    return new RentalRequest({
      id: resource.id,
      equipmentId: resource.equipmentId,
      constructionUserId: resource.constructionUserId,
      rentalCompanyUserId: resource.rentalCompanyUserId,
      period: new DateRange({
        startDate: new Date(resource.startDate),
        endDate: new Date(resource.endDate),
      }),
      status: resource.status,
      createdAt: new Date(resource.createdAt),
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
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
