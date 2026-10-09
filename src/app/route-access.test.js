import { describe, expect, it } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { checkRouteAccess } from './route-access.js';

function session(role = 'rental_company') {
  return { isSignedIn: { value: true }, currentUserId: { value: 1 }, currentRole: { value: role } };
}
const route = (meta = {}) => ({ meta });
describe('route access across integrated contexts', () => {
  it('allows public terms without a session', async () => {
    expect(await checkRouteAccess(route({ public: true }), undefined)).toBe(true);
  });
  it('denies private routes when IAM is missing', async () => {
    expect(await checkRouteAccess(route(), undefined)).toBe('/iam/sign-in');
  });
  it('allows anonymous sign-in and redirects an existing session', async () => {
    expect(await checkRouteAccess(route({ anonymous: true }), undefined)).toBe(true);
    expect(await checkRouteAccess(route({ anonymous: true }), session())).toBe('/dashboard');
  });
  it('denies the wrong role before running the subscription check', async () => {
    let checks = 0;
    const result = await checkRouteAccess(route({ role: 'rental_company', accessCheck: () => { checks++; return of(true); } }), session('construction_company'));
    expect(result).toBe('/dashboard');
    expect(checks).toBe(0);
  });
  it('opens management only when the access port explicitly grants access', async () => {
    expect(await checkRouteAccess(route({ accessCheck: id => of(id === 1) }), session())).toBe(true);
    expect(await checkRouteAccess(route({ accessCheck: () => of(false) }), session())).toBe('/subscriptions/plans');
  });
  it('keeps plans reachable to recover expired access without a loop', async () => {
    expect(await checkRouteAccess(route({ role: 'rental_company' }), session())).toBe(true);
  });
  it('denies management when the access API fails', async () => {
    expect(await checkRouteAccess(route({ accessCheck: () => throwError(() => new Error('offline')) }), session())).toEqual({ path: '/dashboard', query: { access: 'unavailable' } });
  });
  it('does not enter a private route after logout during the access request', async () => {
    const iam = session(), response = new Subject();
    const pending = checkRouteAccess(route({ accessCheck: () => response }), iam);
    iam.isSignedIn.value = false;
    response.next(true);
    expect(await pending).toBe('/iam/sign-in');
  });
  it('does not reuse approval after switching accounts', async () => {
    const iam = session(), response = new Subject();
    const pending = checkRouteAccess(route({ accessCheck: () => response }), iam);
    iam.currentUserId.value = 2;
    response.next(true);
    expect(await pending).toBe('/dashboard');
  });
});
