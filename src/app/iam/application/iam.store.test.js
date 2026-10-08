import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

const api = vi.hoisted(() => ({ signIn: vi.fn(), signUp: vi.fn() }));
vi.mock('../../shared/infrastructure/services.js', () => ({ resolve: () => api }));
import { IamStore } from './iam.store.js';

const account = (role = 'rental_company') => ({
  id: 7, email: 'operador@example.test', role, status: 'active', token: 'test-token',
});
let router;
beforeEach(() => {
  vi.resetAllMocks();
  const values = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  });
  router = { push: vi.fn().mockResolvedValue(undefined) };
});
afterEach(() => vi.unstubAllGlobals());

describe('IAM: sesión de ambas empresas', () => {
  it.each(['rental_company', 'construction_company'])('persiste y restaura %s', async (role) => {
    api.signIn.mockReturnValue(of(account(role)));
    const store = new IamStore();
    await store.signIn({}, router);
    const restored = new IamStore();
    expect(restored.isSignedIn.value).toBe(true);
    expect(restored.currentRole.value).toBe(role);
    expect(restored.currentUserId.value).toBe(7);
    expect(restored.currentToken.value).toBe('test-token');
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });

  it('rechaza una cuenta inactiva sin guardar sesión', async () => {
    api.signIn.mockReturnValue(of({ ...account(), status: 'inactive' }));
    const store = new IamStore();
    await store.signIn({}, router);
    expect(store.isSignedIn.value).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(store.error.value).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('limpia una sesión persistida incompleta', () => {
    localStorage.setItem('token', 'old-token');
    localStorage.setItem('userId', '7');
    const store = new IamStore();
    expect(store.isSignedIn.value).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('no vuelve a autenticar si la respuesta llega después de cerrar sesión', async () => {
    const response = new Subject();
    api.signIn.mockReturnValue(response);
    const store = new IamStore();
    const pending = store.signIn({}, router);
    await store.signOut(router);
    router.push.mockClear();
    response.next(account());
    await pending;
    expect(store.isSignedIn.value).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
    expect(store.loading.value).toBe(false);
  });

  it('un error atrasado no borra la nueva sesión', async () => {
    const oldResponse = new Subject();
    api.signIn.mockReturnValueOnce(oldResponse).mockReturnValueOnce(of(account()));
    const store = new IamStore();
    const oldAttempt = store.signIn({}, router);
    await store.signOut(router);
    await store.signIn({}, router);
    oldResponse.error(new Error('Respuesta de la sesión anterior'));
    await oldAttempt;
    expect(store.isSignedIn.value).toBe(true);
    expect(store.error.value).toBeNull();
    expect(localStorage.getItem('token')).toBe('test-token');
  });

  it('un registro pendiente no navega tras cerrar sesión', async () => {
    const response = new Subject();
    api.signUp.mockReturnValue(response);
    const store = new IamStore();
    const pending = store.signUp({}, router);
    await store.signOut(router);
    router.push.mockClear();
    response.next({ id: 7 });
    await pending;
    expect(router.push).not.toHaveBeenCalled();
    expect(store.loading.value).toBe(false);
  });

  it('muestra el error de credenciales y permite reintentar', async () => {
    api.signIn.mockReturnValueOnce(throwError(() => new Error('Credenciales inválidas')))
      .mockReturnValueOnce(of(account()));
    const store = new IamStore();
    await store.signIn({}, router);
    expect(store.error.value).toBe('Credenciales inválidas');
    expect(store.loading.value).toBe(false);
    await store.signIn({}, router);
    expect(store.error.value).toBeNull();
    expect(store.isSignedIn.value).toBe(true);
  });
});
