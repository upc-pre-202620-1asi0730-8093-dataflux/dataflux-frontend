import { Observable, Subject } from 'rxjs';

// Composition root: services and ACL ports are application-scoped singletons.
const instances = new Map();
const providers = new Map();
export const sessionEnded = new Subject();
export const sessionExpired = new Subject();
export function register(token, provider) {
  providers.set(token, provider);
}
export function resolve(token) {
  if (!instances.has(token)) {
    const Provider = providers.get(token) ?? token;
    if (typeof Provider !== 'function') throw new Error(`Missing provider: ${String(token)}`);
    instances.set(token, new Provider());
  }
  return instances.get(token);
}
export class QueryParams extends URLSearchParams {
  set(name, value) {
    super.set(name, value);
    return this;
  }
}
// Cold, cancellable requests preserve the existing RxJS business workflows.
export class FetchClient {
  request(method, endpoint, body, options = {}) {
    return new Observable((subscriber) => {
      const controller = new AbortController();
      const url = new URL(endpoint, globalThis.location?.origin ?? 'http://localhost');
      if (options.params) url.search = options.params.toString();
      const headers = { Accept: 'application/json' };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const token = globalThis.localStorage?.getItem('token');
      if (token) headers.Authorization = `Bearer ${token}`;
      const resource =
        method === 'POST' && body?.id === 0
          ? Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id'))
          : body;
      fetch(url, {
        method,
        headers,
        body: resource === undefined ? undefined : JSON.stringify(resource),
        signal: controller.signal,
      })
        .then(async (response) => {
          const isAuthenticationRequest = /\/(authentication|auth)\//.test(url.pathname);
          if (
            response.status === 401 &&
            !isAuthenticationRequest &&
            token &&
            !subscriber.closed &&
            globalThis.localStorage?.getItem('token') === token
          ) {
            sessionExpired.next();
          }
          const text = await response.text();
          const data = text ? JSON.parse(text) : undefined;
          if (!response.ok) {
            const error = new Error(data?.message ?? `HTTP ${response.status}`);
            error.status = response.status;
            error.error = data;
            throw error;
          }
          subscriber.next(data);
          subscriber.complete();
        })
        .catch((error) => {
          if (!subscriber.closed) subscriber.error(error);
        });
      return () => controller.abort();
    });
  }
  get(url, options) {
    return this.request('GET', url, undefined, options);
  }
  post(url, body) {
    return this.request('POST', url, body);
  }
  put(url, body) {
    return this.request('PUT', url, body);
  }
  patch(url, body) {
    return this.request('PATCH', url, body);
  }
}
