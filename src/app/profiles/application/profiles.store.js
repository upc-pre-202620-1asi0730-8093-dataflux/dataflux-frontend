import { resolve, sessionEnded } from "../../shared/infrastructure/services.js";
import { shallowRef, shallowReadonly } from "vue";
import { firstValueFrom, takeUntil, retry } from "rxjs";

import { ProfilesApi } from "../infrastructure/profiles-api.js";
export class ProfilesStore {
  #profilesApi = resolve(ProfilesApi);
  #profileState = shallowRef(undefined);
  profile = shallowReadonly(this.#profileState);
  #loadingState = shallowRef(false);
  loading = shallowReadonly(this.#loadingState);
  #errorState = shallowRef(null);
  error = shallowReadonly(this.#errorState);
  #request;
  #version = 0;
  loadProfileByUserId(userId) {
    this.#request?.unsubscribe();
    const version = ++this.#version;
    this.#loadingState.value = true;
    this.#errorState.value = null;
    this.#request = this.#profilesApi
      .getProfileByUserId(userId)
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (profile) => {
          if (version !== this.#version) return;
          this.#profileState.value = profile;
          this.#loadingState.value = false;
          this.#errorState.value = null;
        },
        error: (err) => {
          if (version !== this.#version) return;
          this.#profileState.value = undefined;
          this.#errorState.value = this.#formatError(
            err,
            "Failed to load profile",
          );
          this.#loadingState.value = false;
        },
      });
  }
  async updateProfile(updatedProfile) {
    if (this.#loadingState.value) return false;
    this.#request?.unsubscribe();
    const version = ++this.#version;
    this.#loadingState.value = true;
    this.#errorState.value = null;
    try {
      const operation = updatedProfile.id
        ? this.#profilesApi.updateProfile(updatedProfile).pipe(retry(2))
        : this.#profilesApi.createProfile(updatedProfile);
      const profile = await firstValueFrom(
        operation.pipe(takeUntil(sessionEnded)),
      );
      if (version !== this.#version) return false;
      this.#profileState.value = profile;
      return true;
    } catch (err) {
      if (version === this.#version)
        this.#errorState.value = this.#formatError(
          err,
          "Failed to save profile",
        );
      return false;
    } finally {
      if (version === this.#version) this.#loadingState.value = false;
    }
  }
  clearProfile() {
    ++this.#version;
    this.#request?.unsubscribe();
    this.#profileState.value = undefined;
    this.#errorState.value = null;
    this.#loadingState.value = false;
  }
  #formatError(error, fallback) {
    if (error instanceof Error) {
      return error.message.includes("Resource not found")
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  }
}
