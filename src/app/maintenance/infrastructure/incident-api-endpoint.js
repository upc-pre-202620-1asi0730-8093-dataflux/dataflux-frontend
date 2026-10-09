import { map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint.js';

import { IncidentStatus } from '../domain/model/incident-status.enum.js';
import { IncidentAssembler } from './incident-assembler.js';
export class IncidentApiEndpoint extends BaseApiEndpoint {
  #httpClient;
  #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderIncidentsEndpointPath}`;
  #incidentAssembler = new IncidentAssembler();
  constructor(http) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderIncidentsEndpointPath}`,
      new IncidentAssembler(),
    );
    this.#httpClient = http;
  }
  resolveIncident(incident) {
    if (
      !Number.isInteger(incident.id) ||
      incident.id <= 0 ||
      incident.status !== IncidentStatus.RESOLVED ||
      incident.resolvedAt === null
    ) {
      throw new Error('Incident must be resolved before persisting');
    }
    return this.#httpClient
      .patch(`${this.#endpointUrl}/${incident.id}`, {
        status: incident.status,
        resolvedAt: incident.resolvedAt.toISOString(),
      })
      .pipe(map((resource) => this.#incidentAssembler.toEntityFromResource(resource)));
  }
  requireRentalRestriction(incident) {
    if (
      !Number.isInteger(incident.id) ||
      incident.id <= 0 ||
      incident.status !== IncidentStatus.OPEN ||
      !incident.blocksRental
    ) {
      throw new Error('Only an open blocking incident can be persisted');
    }
    const url = `${this.#endpointUrl}/${incident.id}`;
    return this.#httpClient.get(url).pipe(
      switchMap((current) => {
        if (
          current.equipmentId !== incident.equipmentId ||
          (current.status ?? IncidentStatus.OPEN) !== IncidentStatus.OPEN
        ) {
          throw new Error('The incident was modified or already resolved');
        }
        if (current.blocksRental === true) {
          return of(current);
        }
        return this.#httpClient.patch(url, {
          blocksRental: true,
        });
      }),
      map((resource) => this.#incidentAssembler.toEntityFromResource(resource)),
    );
  }
}
