<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useServices, clearSessionData } from './app.services.js';
import LanguageSwitcher from './shared/presentation/components/language-switcher/LanguageSwitcher.vue';
const { iam, subscriptions } = useServices();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authPage = computed(() => route.path.startsWith('/iam/'));
watch(
  () => iam.currentUserId.value,
  (id, previous) => {
    if (previous !== undefined && id !== previous) clearSessionData();
    if (id && iam.currentRole.value === 'rental_company') subscriptions.loadCurrentSubscription(id);
  },
  { immediate: true, flush: 'sync' },
);
const navigation = computed(() => {
  const options = [['/dashboard', 'dashboard']];
  if (iam.currentRole.value === 'rental_company') {
    const subscription = subscriptions.currentSubscription.value;
    const plan =
      subscription?.userId === iam.currentUserId.value &&
      subscription.status === 'ACTIVE' &&
      subscription.period.contains(new Date())
        ? subscription.planId
        : 0;
    if (plan >= 1)
      options.push(['/inventory/equipment', 'equipment'], ['/rentals/requests', 'rental-requests']);
    if (plan >= 2) options.push(['/rentals/active', 'rentals']);
    if (plan >= 3) options.push(['/maintenance', 'maintenance']);
    options.push(['/subscriptions/plans', 'plan-subscription']);
  } else
    options.push(
      ['/inventory/search', 'search-equipment'],
      ['/rentals/my-requests', 'my-requests'],
    );
  options.push(['/profiles/profile', 'profile']);
  return options;
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
        <span>{{ iam.currentEmail.value }}</span>
        <div class="actions">
          <LanguageSwitcher /><button class="secondary" @click="iam.signOut(router)">
            {{ t('dashboard.sign-out') }}
          </button>
        </div>
      </header>
      <main class="page"><RouterView :key="route.fullPath" /></main>
      <footer>© {{ new Date().getFullYear() }} RentBuild · {{ t('footer.rights') }}</footer>
    </div>
  </div>
</template>

