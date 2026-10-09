import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint.js';
import { environment } from '../../../environments/environment.js';

import { EquipmentCategoryAssembler } from './equipment-category-assembler.js';
export class EquipmentCategoriesApiEndpoint extends BaseApiEndpoint {
    constructor(http) {
        super(
            http,
            `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentCategoriesEndpointPath}`,
            new EquipmentCategoryAssembler(),
        );
    }
}
