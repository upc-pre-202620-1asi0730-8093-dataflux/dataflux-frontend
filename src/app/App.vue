<script setup>
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useServices, clearSessionData } from "./app.services.js";
import LanguageSwitcher from "./shared/presentation/components/language-switcher/LanguageSwitcher.vue";
import AppFooter from "./shared/presentation/components/app-footer/AppFooter.vue";
const { iam, profiles } = useServices();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const standalonePage = computed(
  () => route.meta.anonymous === true || route.meta.public === true,
);
watch(
  () => iam?.currentUserId.value ?? null,
  (id, previous) => {
    if (previous !== undefined && id !== previous) clearSessionData();
  },
  { immediate: true, flush: "sync" },
);
const navigation = computed(() => {
  const links = [["/dashboard", "dashboard"]];
  if (iam && profiles) links.push(["/profiles/profile", "profile"]);
  return links;
});
</script>
<template>
  <a class="skip-link" href="#main-content">{{ t("common.skip-content") }}</a>
  <template v-if="standalonePage">
    <RouterView :key="route.fullPath" />
    <AppFooter />
  </template>
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
        <span>{{ iam?.currentEmail.value || t("app.name") }}</span>
        <div class="actions">
          <LanguageSwitcher /><button
            v-if="iam?.isSignedIn.value"
            class="secondary"
            @click="iam.signOut(router)"
          >
            {{ t("dashboard.sign-out") }}
          </button>
        </div>
      </header>
      <main id="main-content" class="page" tabindex="-1">
        <RouterView :key="route.fullPath" />
      </main>
      <AppFooter />
    </div>
  </div>
</template>
