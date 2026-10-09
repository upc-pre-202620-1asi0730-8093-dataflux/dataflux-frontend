<script setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import LanguageSwitcher from "../../components/language-switcher/LanguageSwitcher.vue";
const { t } = useI18n();
const content = ref(null);
const sections = ["scope", "data", "session", "availability"];
onMounted(() => content.value?.focus());
</script>
<template>
  <main ref="content" id="main-content" class="page terms-page" tabindex="-1" aria-labelledby="terms-title">
    <div class="actions terms-heading">
      <img src="/rentbuild-logo.png" alt="RentBuild" class="logo" />
      <LanguageSwitcher />
    </div>
    <h1 id="terms-title">{{ t("terms.title") }}</h1>
    <p class="notice">{{ t("terms.introduction") }}</p>
    <section v-for="section in sections" :key="section" class="card">
      <h2>{{ t("terms." + section + ".title") }}</h2>
      <p>{{ t("terms." + section + ".description") }}</p>
    </section>
    <RouterLink to="/" class="button secondary">{{
      t("terms.return")
    }}</RouterLink>
  </main>
</template>
