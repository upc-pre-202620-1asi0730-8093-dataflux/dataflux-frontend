import { createRouter, createWebHistory } from "vue-router";
import { useServices } from "./app.services.js";

const routeModules = import.meta.glob("./*/presentation/*-routes.js", {
  eager: true,
  import: "routes",
});
const contextRoutes = Object.values(routeModules).flat();
const home = contextRoutes.some((route) => route.path === "/iam/sign-in")
  ? "/iam/sign-in"
  : "/dashboard";
export const routes = [
  { path: "/", redirect: home },
  {
    path: "/terms",
    component: () => import("./shared/presentation/views/terms/Terms.vue"),
    meta: { public: true },
  },
  {
    path: "/dashboard",
    component: () =>
      import("./shared/presentation/views/dashboard/Dashboard.vue"),
  },
  ...contextRoutes,
  { path: "/:pathMatch(.*)*", redirect: home },
];
export function authorizeRoute(to) {
  if (to.meta.public === true) return true;
  const { iam } = useServices();
  if (!iam) return to.meta.requiresAuth ? "/dashboard" : true;
  if (to.meta.anonymous) return iam.isSignedIn.value ? "/dashboard" : true;
  return iam.isSignedIn.value ? true : "/iam/sign-in";
}
export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});
router.beforeEach(authorizeRoute);
router.afterEach(() => {
  document.title = "RentBuild";
});
