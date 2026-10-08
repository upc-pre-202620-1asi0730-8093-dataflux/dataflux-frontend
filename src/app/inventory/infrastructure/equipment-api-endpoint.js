import { QueryParams } from '../../shared/infrastructure/services.js';

import { catchError, map } from 'rxjs/operators';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint.js';
import { environment } from '../../../environments/environment.js';

import { EquipmentAssembler } from './equipment-assembler.js';
export class EquipmentApiEndpoint extends BaseApiEndpoint {
  constructor(http) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}`,
      new EquipmentAssembler(),
    );
  }
  patchEditableFields(equipment) {
    if (!Number.isInteger(equipment.id) || equipment.id <= 0) {
      throw new Error('Invalid equipment identifier');
    }
    const editable = {
      code: equipment.code,
      name: equipment.name,
      description: equipment.description,
      categoryId: equipment.categoryId,
      location: equipment.location,
      dailyRate: equipment.rentalRate.dailyRate,
      weeklyRate: equipment.rentalRate.weeklyRate,
    };
    return this.http.patch(`${this.endpointUrl}/${equipment.id}`, editable).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to update editable equipment fields')),
    );
  }
  getByUserId(userId) {
    const params = new QueryParams().set('userId', userId.toString());
    return this.http
      .get(this.endpointUrl, {
        params,
      })
      .pipe(
        map((response) => {
          const resources = Array.isArray(response) ? response : response.equipments;
          return resources.map((resource) => this.assembler.toEntityFromResource(resource));
        }),
        catchError(this.handleError('Failed to fetch equipment by user id')),
      );
  }
}
