<script setup>
import { useI18n } from 'vue-i18n';
const { locale, t } = useI18n();
function change(event) {
  locale.value = event.target.value;
  localStorage.setItem('language', locale.value);
  document.documentElement.lang = locale.value;
}
</script>
<template>
  <select :aria-label="t('common.language')" :value="locale" class="language" @change="change">
    <option value="es">Español</option>
    <option value="en">English</option>
  </select>
</template>
