import { BaseApi } from "../../shared/infrastructure/base-api.js";

import { ProfilesApiEndpoint } from "./profiles-api-endpoint.js";
export class ProfilesApi extends BaseApi {
  #profilesEndpoint = new ProfilesApiEndpoint(this.http);
  getProfileByUserId(userId) {
    return this.#profilesEndpoint.getByUserId(userId);
  }
  updateProfile(profile) {
    return this.#profilesEndpoint.update(profile, profile.id);
  }
  createProfile(profile) {
    return this.#profilesEndpoint.create(profile);
  }
}
