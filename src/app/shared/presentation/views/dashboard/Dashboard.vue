<script setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useServices } from '../../../../app.services.js';
import Feedback from '../../components/feedback/Feedback.vue';
const { t } = useI18n();
const { iam, profiles } = useServices();
const rentalCompany = computed(() => iam.currentRole.value === 'rental_company');
onMounted(() => profiles.loadProfileByUserId(iam.currentUserId.value));
</script>
<template>
  <span class="eyebrow">{{ t(rentalCompany ? 'dashboard.rental-company' : 'dashboard.construction-company') }}</span>
  <h1>{{ t(rentalCompany ? 'dashboard.rental-title' : 'dashboard.construction-title') }}</h1>
  <p>{{ t('dashboard.welcome') }} {{ profiles.profile.value?.companyName || iam.currentEmail.value }}</p>
  <Feedback :loading="profiles.loading.value" :error="profiles.error.value" />
  <section class="card">
    <h2>{{ t('navigation.profile') }}</h2>
    <RouterLink class="button" to="/profiles/profile">{{ t('profile.edit') }}</RouterLink>
  </section>
</template>
