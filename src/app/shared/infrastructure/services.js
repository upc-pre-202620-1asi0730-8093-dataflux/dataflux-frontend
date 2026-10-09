import axios from "axios";
import { createPinia, storeToRefs } from "pinia";
import { Observable, Subject } from "rxjs";

// Composition root: services and ACL ports are application-scoped singletons.
const instances = new Map();
const providers = new Map();
const storeDefinitions = new Map();
export const pinia = createPinia();
export function registerStore(token, definition) {
  storeDefinitions.set(token, definition);
}
// Keep domain objects with private fields outside Vue's deep proxies.
export function exposeStore(model) {
  const state = { ...model };
  for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(model))) {
    if (name !== "constructor" && typeof model[name] === "function") {
      state[name] = model[name].bind(model);
    }
  }
  return state;
}
export const sessionEnded = new Subject();
export const sessionExpired = new Subject();
export function register(token, provider) {
  providers.set(token, provider);
}
export function resolve(token) {
  if (!instances.has(token)) {
    if (storeDefinitions.has(token)) {
      const store = storeDefinitions.get(token)(pinia);
      const state = storeToRefs(store);
      for (const name of Object.keys(store)) {
        if (!name.startsWith("$") && typeof store[name] === "function")
          state[name] = store[name];
      }
      instances.set(token, state);
      return state;
    }
    const Provider = providers.get(token) ?? token;
    if (typeof Provider !== "function")
      throw new Error(`Missing provider: ${String(token)}`);
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
// Axios transport with cancellable observables for the domain workflows.
export class HttpClient {
  request(method, endpoint, body, options = {}) {
    return new Observable((subscriber) => {
      const controller = new AbortController();
      const url = new URL(
        endpoint,
        globalThis.location?.origin ?? "http://localhost",
      );
      if (options.params) url.search = options.params.toString();
      const headers = { Accept: "application/json" };
      if (body !== undefined) headers["Content-Type"] = "application/json";
      const token = globalThis.localStorage?.getItem("token");
      if (token) headers.Authorization = `Bearer ${token}`;
      const resource =
        method === "POST" && body?.id === 0
          ? Object.fromEntries(
              Object.entries(body).filter(([key]) => key !== "id"),
            )
          : body;
      axios
        .request({
          url: url.toString(),
          method,
          headers,
          data: resource,
          signal: controller.signal,
          validateStatus: () => true,
        })
        .then((response) => {
          const isAuthenticationRequest = /\/(authentication|auth)\//.test(
            url.pathname,
          );
          if (
            response.status === 401 &&
            !isAuthenticationRequest &&
            token &&
            !subscriber.closed &&
            globalThis.localStorage?.getItem("token") === token
          )
            sessionExpired.next();
          const data = response.status === 204 ? undefined : response.data;
          if (response.status < 200 || response.status >= 300) {
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
    return this.request("GET", url, undefined, options);
  }
  post(url, body) {
    return this.request("POST", url, body);
  }
  put(url, body) {
    return this.request("PUT", url, body);
  }
  patch(url, body) {
    return this.request("PATCH", url, body);
  }
}
