import { createApp } from 'vue';
import App from './app/App.vue';
import { configureServices, useServices } from './app/app.services.js';
import { sessionExpired } from './app/shared/infrastructure/services.js';
import { router } from './app/app.routes.js';
import { i18n } from './i18n.js';
import './styles.css';
configureServices();
sessionExpired.subscribe(() => {
  const { iam } = useServices();
  if (iam?.isSignedIn.value) iam.signOut(router);
});
document.documentElement.lang = i18n.global.locale.value;
createApp(App).use(i18n).use(router).mount('#app');
