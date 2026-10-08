import { resolve } from '../../shared/infrastructure/services.js';
import { ProfilesStore } from './profiles.store.js';

export const services = { profiles: ProfilesStore };
export function clearSession() {
  resolve(ProfilesStore).clearProfile();
}
