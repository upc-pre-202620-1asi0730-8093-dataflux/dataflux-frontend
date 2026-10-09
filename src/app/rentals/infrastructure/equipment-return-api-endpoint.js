import { environment } from '../../../environments/environment.js';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint.js';

import { EquipmentReturnAssembler } from './equipment-return-assembler.js';
export class EquipmentReturnApiEndpoint extends BaseApiEndpoint {
  constructor(http) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentReturnsEndpointPath}`,
      new EquipmentReturnAssembler(),
    );
  }
}
