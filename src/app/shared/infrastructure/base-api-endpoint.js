import { catchError, map } from 'rxjs/operators';
import { ErrorHandlingEnabledBaseType } from './error-handling-enabled-base-type.js';
export class BaseApiEndpoint extends ErrorHandlingEnabledBaseType {
  http;
  endpointUrl;
  assembler;
  constructor(http, endpointUrl, assembler) {
    super();
    this.http = http;
    this.endpointUrl = endpointUrl;
    this.assembler = assembler;
  }
  getAll() {
    return this.http.get(this.endpointUrl).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.map((resource) => this.assembler.toEntityFromResource(resource));
        }
        return this.assembler.toEntitiesFromResponse(response);
      }),
      catchError(this.handleError('Failed to fetch entities')),
    );
  }
  getById(id) {
    return this.http.get(`${this.endpointUrl}/${id}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to fetch entity')),
    );
  }
  create(entity) {
    const resource = this.assembler.toResourceFromEntity(entity);
    return this.http.post(this.endpointUrl, resource).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create entity')),
    );
  }
  update(entity, id) {
    const resource = this.assembler.toResourceFromEntity(entity);
    return this.http.put(`${this.endpointUrl}/${id}`, resource).pipe(
      map((updated) => this.assembler.toEntityFromResource(updated)),
      catchError(this.handleError('Failed to update entity')),
    );
  }
}
