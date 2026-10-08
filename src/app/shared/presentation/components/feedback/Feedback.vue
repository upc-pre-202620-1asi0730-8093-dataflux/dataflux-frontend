<script setup>
import { useI18n } from 'vue-i18n';
defineProps({ loading: Boolean, error: String, success: [Boolean, String] });
const { t } = useI18n();
</script>
<template>
  <p v-if="loading" role="status" class="notice">{{ t('common.loading') }}</p>
  <p v-if="error" role="alert" class="notice error">{{ error }}</p>
  <p v-if="success" role="status" class="notice success">
    {{ typeof success === 'string' ? success : t('common.success') }}
  </p>
</template>
