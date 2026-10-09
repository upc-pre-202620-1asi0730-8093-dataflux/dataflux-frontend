<script setup>
import { useI18n } from "vue-i18n";
import { saveLocalePreference } from "../../locale-preference.js";
const { locale, t } = useI18n();
function change(event) {
  locale.value = saveLocalePreference(event.target.value);
}
</script>
<template>
  <select
    :aria-label="t('common.language')"
    :value="locale"
    class="language"
    @change="change"
  >
    <option value="en-US">English</option>
    <option value="es-419">Español (Latinoamérica)</option>
  </select>
</template>
