import { useServices } from '../../app.services.js';

export function rentalCompanyOnly() {
  const { iam } = useServices();
  return iam?.currentRole.value === 'rental_company' ? true : '/dashboard';
}

export const routes = [
  {
    path: "/subscriptions",
    redirect: "/subscriptions/plans",
    meta: { requiresAuth: true },
  },
  {
    path: "/subscriptions/plans",
    component: () => import("./views/plans/Plans.vue"),
    beforeEnter: rentalCompanyOnly,
    meta: { requiresAuth: true },
  },
];
