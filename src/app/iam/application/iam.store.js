import { shallowRef, shallowReadonly, computed } from 'vue';
import { firstValueFrom } from 'rxjs';
import { resolve } from '../../shared/infrastructure/services.js';
import { IamApi } from '../infrastructure/iam-api.js';
export class IamStore {
  #api = resolve(IamApi);
  #signedIn = shallowRef(false);
  #userId = shallowRef(null);
  #email = shallowRef(null);
  #role = shallowRef(null);
  #status = shallowRef(null);
  #busy = shallowRef(false);
  #error = shallowRef(null);
  #version = 0;
  isSignedIn = shallowReadonly(this.#signedIn);
  currentUserId = shallowReadonly(this.#userId);
  currentEmail = shallowReadonly(this.#email);
  currentRole = shallowReadonly(this.#role);
  currentStatus = shallowReadonly(this.#status);
  loading = shallowReadonly(this.#busy);
  error = shallowReadonly(this.#error);
  currentToken = computed(() => (this.#signedIn.value ? localStorage.getItem('token') : null));
  constructor() {
    const id = Number(localStorage.getItem('userId'));
    const role = localStorage.getItem('role');
    if (
      localStorage.getItem('token') &&
      Number.isInteger(id) &&
      id > 0 &&
      localStorage.getItem('email') &&
      ['rental_company', 'construction_company'].includes(role) &&
      localStorage.getItem('status') === 'active'
    ) {
      this.#userId.value = id;
      this.#email.value = localStorage.getItem('email');
      this.#role.value = role;
      this.#status.value = 'active';
      this.#signedIn.value = true;
    } else this.#clear();
  }
  async signIn(command, router) {
    if (this.#busy.value) return;
    const version = ++this.#version;
    this.#busy.value = true;
    this.#error.value = null;
    try {
      const user = await firstValueFrom(this.#api.signIn(command));
      if (version !== this.#version) return;
      if (
        user.status !== 'active' ||
        !['rental_company', 'construction_company'].includes(user.role)
      )
        throw new Error('Account is not active');
      for (const [key, value] of Object.entries({
        token: user.token,
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      }))
        localStorage.setItem(key, String(value));
      this.#email.value = user.email;
      this.#role.value = user.role;
      this.#status.value = user.status;
      this.#userId.value = user.id;
      this.#signedIn.value = true;
      await router.push('/dashboard');
    } catch (error) {
      if (version !== this.#version) return;
      this.#clear();
      this.#error.value = error.message;
    } finally {
      if (version === this.#version) this.#busy.value = false;
    }
  }
  async signUp(command, router) {
    if (this.#busy.value) return;
    const version = ++this.#version;
    this.#busy.value = true;
    this.#error.value = null;
    try {
      await firstValueFrom(this.#api.signUp(command));
      if (version !== this.#version) return;
      await router.push({ path: '/iam/sign-in', query: { registered: '1' } });
    } catch (error) {
      if (version !== this.#version) return;
      this.#error.value = error.message;
    } finally {
      if (version === this.#version) this.#busy.value = false;
    }
  }
  clearError() {
    this.#error.value = null;
  }
  signOut(router) {
    ++this.#version;
    this.#busy.value = false;
    this.#clear();
    this.clearError();
    return router.push('/iam/sign-in');
  }
  #clear() {
    for (const key of ['token', 'userId', 'email', 'role', 'status']) localStorage.removeItem(key);
    this.#signedIn.value = false;
    this.#userId.value = null;
    this.#email.value = null;
    this.#role.value = null;
    this.#status.value = null;
  }
}
