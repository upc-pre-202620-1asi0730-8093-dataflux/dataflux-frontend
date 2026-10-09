import { environment } from '../../../environments/environment.js';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint.js';

import { MaintenanceAssembler } from './maintenance-assembler.js';
export class MaintenanceApiEndpoint extends BaseApiEndpoint {
  constructor(http) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderMaintenancesEndpointPath}`,
      new MaintenanceAssembler(),
    );
  }
}
