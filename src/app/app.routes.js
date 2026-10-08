import { createRouter, createWebHistory } from 'vue-router';
import { firstValueFrom } from 'rxjs';
import { useServices } from './app.services.js';
import { resolve } from './shared/infrastructure/services.js';
import { SUBSCRIPTION_ACCESS_PORT } from './rentals/infrastructure/subscription-access.port.js';
import { MAINTENANCE_ACCESS_PORT } from './maintenance/infrastructure/maintenance-access.port.js';

export const routes = [
  { path: '/', redirect: '/iam/sign-in' },
  {
    path: '/iam/sign-in',
    component: () => import('./iam/presentation/views/sign-in/SignIn.vue'),
    meta: { anonymous: true },
  },
  {
    path: '/iam/sign-up',
    component: () => import('./iam/presentation/views/sign-up/SignUp.vue'),
    meta: { anonymous: true },
  },
  {
    path: '/dashboard',
    component: () => import('./shared/presentation/views/dashboard/Dashboard.vue'),
  },
  { path: '/profiles', redirect: '/profiles/profile' },
  {
    path: '/profiles/profile',
    component: () => import('./profiles/presentation/views/profile/Profile.vue'),
  },
  {
    path: '/inventory/equipment',
    component: () => import('./inventory/presentation/views/equipment-list/EquipmentList.vue'),
    meta: { role: 'rental_company', access: 'inventory' },
  },
  {
    path: '/inventory/equipment/new',
    component: () => import('./inventory/presentation/views/equipment-form/EquipmentForm.vue'),
    meta: { role: 'rental_company', access: 'inventory' },
  },
  {
    path: '/inventory/equipment/:id/edit',
    component: () => import('./inventory/presentation/views/equipment-form/EquipmentForm.vue'),
    meta: { role: 'rental_company', access: 'inventory' },
  },
  {
    path: '/inventory/equipment/:id',
    component: () => import('./inventory/presentation/views/equipment-detail/EquipmentDetail.vue'),
  },
  {
    path: '/inventory/search',
    component: () => import('./inventory/presentation/views/equipment-search/EquipmentSearch.vue'),
  },
  { path: '/rentals', redirect: '/rentals/requests' },
  {
    path: '/rentals/requests',
    component: () => import('./rentals/presentation/views/rental-requests/RentalRequests.vue'),
    meta: { role: 'rental_company', access: 'requests' },
  },
  {
    path: '/rentals/active',
    component: () => import('./rentals/presentation/views/active-rentals/ActiveRentals.vue'),
    meta: { role: 'rental_company', access: 'rentals' },
  },
  {
    path: '/rentals/my-requests',
    component: () => import('./rentals/presentation/views/my-requests/MyRequests.vue'),
    meta: { role: 'construction_company' },
  },
  {
    path: '/rentals/my-requests/:id',
    component: () =>
      import('./rentals/presentation/views/rental-request-detail/RentalRequestDetail.vue'),
    meta: { role: 'construction_company' },
  },
  {
    path: '/maintenance',
    component: () =>
      import('./maintenance/presentation/views/maintenance-list/MaintenanceList.vue'),
    meta: { role: 'rental_company', access: 'maintenance' },
  },
  {
    path: '/maintenance/incidents',
    component: () => import('./maintenance/presentation/views/incident-list/IncidentList.vue'),
    meta: { role: 'rental_company', access: 'maintenance' },
  },
  { path: '/subscriptions', redirect: '/subscriptions/plans' },
  {
    path: '/subscriptions/plans',
    component: () => import('./subscriptions/presentation/views/plans/Plans.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: '/iam/sign-in' },
];
export async function authorizeRoute(to) {
  const { iam, inventory, rentals } = useServices();
  if (to.meta.anonymous) return iam.isSignedIn.value ? '/dashboard' : true;
  if (!iam.isSignedIn.value) return '/iam/sign-in';
  if (to.meta.role && to.meta.role !== iam.currentRole.value) return '/dashboard';
  const id = iam.currentUserId.value;
  try {
    const checks = {
      inventory: () => inventory.canManageInventory(id),
      rentals: () => rentals.canManageRentals(id),
      requests: () => resolve(SUBSCRIPTION_ACCESS_PORT).hasActiveSubscription(id),
      maintenance: () => resolve(MAINTENANCE_ACCESS_PORT).canRegisterMaintenance(id),
    };
    if (checks[to.meta.access] && !(await firstValueFrom(checks[to.meta.access]())))
      return '/subscriptions/plans';
  } catch {
    return '/subscriptions/plans';
  }
  return true;
}
export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});
router.beforeEach(authorizeRoute);
router.afterEach(() => {
  document.title = 'RentBuild';
});

