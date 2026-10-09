import { createApp, watch } from "vue";
import PrimeVue from "primevue/config";
import App from "./app/App.vue";
import { configureServices, useServices } from "./app/app.services.js";
import { sessionExpired } from "./app/shared/infrastructure/services.js";
import { router } from "./app/app.routes.js";
import { i18n } from "./i18n.js";
import { resolveLocale } from "./app/shared/presentation/locale-preference.js";
import "./styles.css";
configureServices();
sessionExpired.subscribe(() => {
  const { iam } = useServices();
  if (iam?.isSignedIn.value) iam.signOut(router);
});
watch(
  i18n.global.locale,
  (locale) => {
    document.documentElement.lang = resolveLocale(locale);
  },
  { immediate: true },
);
createApp(App)
  .use(PrimeVue, { unstyled: true })
  .use(i18n)
  .use(router)
  .mount("#app");
