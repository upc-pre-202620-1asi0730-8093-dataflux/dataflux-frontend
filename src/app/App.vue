<script setup>
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useServices, clearSessionData } from "./app.services.js";
import LanguageSwitcher from "./shared/presentation/components/language-switcher/LanguageSwitcher.vue";
import AppFooter from "./shared/presentation/components/app-footer/AppFooter.vue";
const { iam, subscriptions } = useServices();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authPage = computed(
  () => route.meta.anonymous === true || route.meta.public === true,
);
watch(
  () => iam.currentUserId.value,
  (id, previous) => {
    if (previous !== undefined && id !== previous) clearSessionData();
    if (id && iam.currentRole.value === "rental_company")
      subscriptions.loadCurrentSubscription(id);
  },
  { immediate: true, flush: "sync" },
);
const navigation = computed(() => {
  const options = [["/dashboard", "dashboard"]];
  if (iam.currentRole.value === "rental_company") {
    const subscription = subscriptions.currentSubscription.value;
    const plan =
      subscription?.userId === iam.currentUserId.value &&
      subscription.status === "ACTIVE" &&
      subscription.period.contains(new Date())
        ? subscription.planId
        : 0;
    if (plan >= 1)
      options.push(
        ["/inventory/equipment", "equipment"],
        ["/rentals/requests", "rental-requests"],
      );
    if (plan >= 2) options.push(["/rentals/active", "rentals"]);
    if (plan >= 3) options.push(["/maintenance", "maintenance"]);
    options.push(["/subscriptions/plans", "plan-subscription"]);
  } else
    options.push(
      ["/inventory/search", "search-equipment"],
      ["/rentals/my-requests", "my-requests"],
    );
  options.push(["/profiles/profile", "profile"]);
  return options;
});
</script>
<template>
  <a class="skip-link" href="#main-content">{{ t("common.skip-content") }}</a>
  <template v-if="authPage"
    ><RouterView :key="route.fullPath" /><AppFooter
  /></template>
  <div v-else class="workspace">
    <aside class="sidebar">
      <RouterLink to="/dashboard"
        ><img src="/rentbuild-logo.png" alt="RentBuild" class="logo"
      /></RouterLink>
      <nav>
        <RouterLink
          v-for="[link, label] in navigation"
          :key="link"
          :to="link"
          >{{ t("navigation." + label) }}</RouterLink
        >
      </nav>
      <span class="sidebar-credit">RentBuild</span>
    </aside>
    <div class="workspace-body">
      <header class="topbar">
        <span>{{ iam.currentEmail.value }}</span>
        <div class="actions">
          <LanguageSwitcher /><pv-button
            type="button"
            class="secondary"
            @click="iam.signOut(router)"
          >
            {{ t("dashboard.sign-out") }}
          </pv-button>
        </div>
      </header>
      <main id="main-content" class="page" tabindex="-1">
        <RouterView :key="route.fullPath" />
      </main>
      <AppFooter />
    </div>
  </div>
</template>
