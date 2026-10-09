<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useServices, clearSessionData } from './app.services.js';
import LanguageSwitcher from './shared/presentation/components/language-switcher/LanguageSwitcher.vue';
const { iam, profiles, subscriptions } = useServices();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authPage = computed(() => route.meta.anonymous === true);
watch(
  () => iam?.currentUserId.value ?? null,
  (id, previous) => {
    if (previous !== undefined && id !== previous) clearSessionData();
  },
  { immediate: true, flush: 'sync' },
);
const navigation = computed(() => {
  const links = [['/dashboard', 'dashboard']];
  if (subscriptions && iam?.currentRole.value === 'rental_company')
    links.push(['/subscriptions/plans', 'plan-subscription']);
  if (iam && profiles) links.push(['/profiles/profile', 'profile']);
  return links;
});
</script>
<template>
  <RouterView v-if="authPage" :key="route.fullPath" />
  <div v-else class="workspace">
    <aside class="sidebar">
      <RouterLink to="/dashboard"
        ><img src="/rentbuild-logo.png" alt="RentBuild" class="logo"
      /></RouterLink>
      <nav>
        <RouterLink v-for="[link, label] in navigation" :key="link" :to="link">{{
          t('navigation.' + label)
        }}</RouterLink>
      </nav>
      <span class="sidebar-credit">RentBuild</span>
    </aside>
    <div class="workspace-body">
      <header class="topbar">
        <span>{{ iam?.currentEmail.value || t('app.name') }}</span>
        <div class="actions">
          <LanguageSwitcher /><button v-if="iam?.isSignedIn.value" class="secondary" @click="iam.signOut(router)">
            {{ t('dashboard.sign-out') }}
          </button>
        </div>
      </header>
      <main class="page"><RouterView :key="route.fullPath" /></main>
      <footer>© {{ new Date().getFullYear() }} RentBuild · {{ t('footer.rights') }}</footer>
    </div>
  </div>
</template>
