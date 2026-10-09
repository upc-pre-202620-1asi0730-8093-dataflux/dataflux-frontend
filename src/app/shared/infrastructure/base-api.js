import { HttpClient, resolve } from './services.js';
export class BaseApi {
  http = resolve(HttpClient);
}
