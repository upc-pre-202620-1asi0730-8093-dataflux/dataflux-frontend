import { firstValueFrom, timeout } from 'rxjs';

export async function checkRouteAccess(to, iam) {
  if (to.meta.public === true) return true;
  if (!iam?.isSignedIn.value) return to.meta.anonymous ? true : '/iam/sign-in';
  if (to.meta.anonymous) return '/dashboard';
  const userId = iam.currentUserId.value;
  const role = iam.currentRole.value;
  if (to.meta.role && to.meta.role !== role) return '/dashboard';
  if (!to.meta.accessCheck) return true;
  try {
    const allowed = await firstValueFrom(to.meta.accessCheck(userId).pipe(timeout(15000)));
    if (!iam.isSignedIn.value) return '/iam/sign-in';
    if (userId !== iam.currentUserId.value || role !== iam.currentRole.value) return '/dashboard';
    return allowed === true ? true : '/subscriptions/plans';
  } catch {
    if (!iam.isSignedIn.value) return '/iam/sign-in';
    return { path: '/dashboard', query: { access: 'unavailable' } };
  }
}
