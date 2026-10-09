import { DateRange } from '../../shared/domain/value-object/date-range.value-object.js';
import { Equipment } from '../domain/model/equipment.entity.js';
import { AvailabilityBlock } from '../domain/model/availability-block.entity.js';
import { RentalRate } from '../domain/value-object/rental-rate.value-object.js';
export class EquipmentAssembler {
    toEntitiesFromResponse(response) {
        return response.equipments.map((resource) => this.toEntityFromResource(resource));
    }
    toEntityFromResource(resource) {
        return new Equipment({
            id: resource.id,
            userId: resource.userId,
            code: resource.code,
            name: resource.name,
            description: resource.description,
            categoryId: resource.categoryId,
            location: resource.location,
            rentalRate: new RentalRate({
                dailyRate: resource.dailyRate,
                weeklyRate: resource.weeklyRate,
            }),
            status: resource.status,
            availabilityBlocks: (resource.availabilityBlocks ?? []).map((block) =>
                this.#toAvailabilityBlock(block),
            ),
        });
    }
    toResourceFromEntity(entity) {
        return {
            id: entity.id,
            userId: entity.userId,
            code: entity.code,
            name: entity.name,
            description: entity.description,
            categoryId: entity.categoryId,
            location: entity.location,
            dailyRate: entity.rentalRate.dailyRate,
            weeklyRate: entity.rentalRate.weeklyRate,
            status: entity.status,
            availabilityBlocks: entity.availabilityBlocks.map((block) =>
                this.#toAvailabilityBlockResource(block),
            ),
        };
    }
    #toAvailabilityBlock(resource) {
        return new AvailabilityBlock({
            id: resource.id,
            period: new DateRange({
                startDate: new Date(resource.startDate),
                endDate: new Date(resource.endDate),
            }),
        });
    }
    #toAvailabilityBlockResource(block) {
        return {
            id: block.id,
            startDate: block.period.startDate.toISOString(),
            endDate: block.period.endDate.toISOString(),
        };
    }
}
