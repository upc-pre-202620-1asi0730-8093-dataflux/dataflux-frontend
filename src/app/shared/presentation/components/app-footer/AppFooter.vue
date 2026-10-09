<script setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>
<template>
  <footer class="app-footer">
    <span
      >© {{ new Date().getFullYear() }} RentBuild ·
      {{ t("footer.rights") }}</span
    >
    <RouterLink to="/terms">{{ t("footer.terms") }}</RouterLink>
  </footer>
</template>
