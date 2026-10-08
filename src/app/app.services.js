import { register, resolve, sessionEnded } from './shared/infrastructure/services.js';
import { environment } from '../environments/environment.js';
import { SIGN_IN_PORT } from './iam/infrastructure/sign-in.port.js';
import { SignInApiEndpoint } from './iam/infrastructure/sign-in-api-endpoint.js';
import { FakeSignInApiEndpoint } from './iam/infrastructure/fake-sign-in-api-endpoint.js';
import { IamStore } from './iam/application/iam.store.js';
import { ProfilesStore } from './profiles/application/profiles.store.js';

export function configureServices() {
  register(SIGN_IN_PORT, environment.production ? SignInApiEndpoint : FakeSignInApiEndpoint);
}
export function useServices() {
  return { iam: resolve(IamStore), profiles: resolve(ProfilesStore) };
}
export function clearSessionData() {
  sessionEnded.next();
  resolve(ProfilesStore).clearProfile();
}
