import PrimeVue from "primevue/config";
import Material from "@primeuix/themes/material";
import { definePreset } from "@primeuix/themes";
import { Button, InputText, Textarea } from "primevue";
import "primeicons/primeicons.css";
import { pinia } from "./app/shared/infrastructure/services.js";
import { createApp, watch } from "vue";
import App from "./app/App.vue";
import { configureServices, useServices } from "./app/app.services.js";
import { sessionExpired } from "./app/shared/infrastructure/services.js";
import { router } from "./app/app.routes.js";
import { i18n } from "./i18n.js";
import "./styles.css";
configureServices();
sessionExpired.subscribe(() => {
  const { iam } = useServices();
  if (iam?.isSignedIn.value) iam.signOut(router);
});
watch(
  i18n.global.locale,
  (locale) => {
    document.documentElement.lang = locale;
  },
  { immediate: true },
);
const rentBuildTheme = definePreset(Material, {
  semantic: {
    primary: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#e77820",
      600: "#c85e12",
      700: "#a64b0e",
      800: "#863e12",
      900: "#6d3413",
      950: "#3b1908",
    },
  },
});
createApp(App)
  .use(pinia)
  .use(i18n)
  .use(PrimeVue, {
    theme: { preset: rentBuildTheme, options: { darkModeSelector: false } },
    ripple: true,
  })
  .component("pv-button", Button)
  .component("pv-input-text", InputText)
  .component("pv-textarea", Textarea)
  .use(router)
  .mount("#app");
