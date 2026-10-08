import { createRouter, createWebHistory } from 'vue-router';
import { useServices } from './app.services.js';

export const routes = [
  { path: '/', redirect: '/iam/sign-in' },
  { path: '/iam/sign-in', component: () => import('./iam/presentation/views/sign-in/SignIn.vue'), meta: { anonymous: true } },
  { path: '/iam/sign-up', component: () => import('./iam/presentation/views/sign-up/SignUp.vue'), meta: { anonymous: true } },
  { path: '/dashboard', component: () => import('./shared/presentation/views/dashboard/Dashboard.vue') },
  { path: '/profiles', redirect: '/profiles/profile' },
  { path: '/profiles/profile', component: () => import('./profiles/presentation/views/profile/Profile.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/iam/sign-in' },
];
export function authorizeRoute(to) {
  const { iam } = useServices();
  if (to.meta.anonymous) return iam.isSignedIn.value ? '/dashboard' : true;
  return iam.isSignedIn.value ? true : '/iam/sign-in';
}
export const router = createRouter({
  history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }),
});
router.beforeEach(authorizeRoute);
router.afterEach(() => { document.title = 'RentBuild'; });
