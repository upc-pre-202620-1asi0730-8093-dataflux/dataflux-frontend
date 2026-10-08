export const routes = [
  { path: '/profiles', redirect: '/profiles/profile', meta: { requiresAuth: true } },
  {
    path: '/profiles/profile',
    component: () => import('./views/profile/Profile.vue'),
    meta: { requiresAuth: true },
  },
];
