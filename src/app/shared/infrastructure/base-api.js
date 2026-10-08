import { FetchClient, resolve } from './services.js';
export class BaseApi {
  http = resolve(FetchClient);
}
