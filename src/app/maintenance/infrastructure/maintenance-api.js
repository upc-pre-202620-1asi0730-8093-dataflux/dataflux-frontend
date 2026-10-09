import { BaseApi } from '../../shared/infrastructure/base-api.js';

import { MaintenanceApiEndpoint } from './maintenance-api-endpoint.js';
export class MaintenanceApi extends BaseApi {
  #maintenanceEndpoint = new MaintenanceApiEndpoint(this.http);
  getMaintenances() {
    return this.#maintenanceEndpoint.getAll();
  }
  createMaintenance(maintenance) {
    return this.#maintenanceEndpoint.create(maintenance);
  }
}
