import { register } from '../../shared/infrastructure/services.js';
import { environment } from '../../../environments/environment.js';
import { SIGN_IN_PORT } from '../infrastructure/sign-in.port.js';
import { SignInApiEndpoint } from '../infrastructure/sign-in-api-endpoint.js';
import { FakeSignInApiEndpoint } from '../infrastructure/fake-sign-in-api-endpoint.js';
import { IamStore } from './iam.store.js';

export const services = { iam: IamStore };
export function configure() {
  register(SIGN_IN_PORT, environment.production ? SignInApiEndpoint : FakeSignInApiEndpoint);
}
