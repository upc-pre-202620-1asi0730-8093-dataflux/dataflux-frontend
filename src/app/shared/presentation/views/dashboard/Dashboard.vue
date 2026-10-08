<script setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useServices } from '../../../../app.services.js';
import Feedback from '../../components/feedback/Feedback.vue';
const { t } = useI18n();
const { iam, profiles } = useServices();
const signedIn = computed(() => iam?.isSignedIn.value ?? false);
const rentalCompany = computed(() => iam?.currentRole.value === 'rental_company');
onMounted(() => {
  if (signedIn.value && profiles) profiles.loadProfileByUserId(iam.currentUserId.value);
});
</script>
<template>
  <span class="eyebrow">{{ signedIn ? t(rentalCompany ? 'dashboard.rental-company' : 'dashboard.construction-company') : t('app.name') }}</span>
  <h1>{{ signedIn ? t(rentalCompany ? 'dashboard.rental-title' : 'dashboard.construction-title') : t('navigation.dashboard') }}</h1>
  <p v-if="signedIn">{{ t('dashboard.welcome') }} {{ profiles?.profile.value?.companyName || iam.currentEmail.value }}</p>
  <Feedback v-if="signedIn && profiles" :loading="profiles.loading.value" :error="profiles.error.value" />
  <section v-if="signedIn && profiles" class="card">
    <h2>{{ t('navigation.profile') }}</h2>
    <RouterLink class="button" to="/profiles/profile">{{ t('profile.edit') }}</RouterLink>
  </section>
</template>
