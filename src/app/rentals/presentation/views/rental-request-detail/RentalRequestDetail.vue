<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useServices } from '../../../../app.services.js';
import { date } from '../../../../shared/presentation/format.js';
import Feedback from '../../../../shared/presentation/components/feedback/Feedback.vue';
const { iam, rentals: store } = useServices();
const { t } = useI18n();
const route = useRoute();
onMounted(() => {
  store.clearRentalRequestDetail();
  const id = Number(route.params.id);
  if (Number.isInteger(id) && id > 0) store.loadRentalRequestDetail(id, iam.currentUserId.value);
});
</script>
<template>
  <RouterLink to="/rentals/my-requests">← {{ t('rentals.my-requests.detail.back') }}</RouterLink>
  <h1>{{ t('rentals.my-requests.detail.title') }} #{{ route.params.id }}</h1>
  <Feedback :loading="store.loading.value" :error="store.error.value" />
  <section v-if="store.selectedRentalRequest.value" class="card">
    <h2>
      {{ store.getEquipmentInformation(store.selectedRentalRequest.value.equipmentId)?.name }}
    </h2>
    <span class="badge" :class="store.selectedRentalRequest.value.status.toLowerCase()">{{
      t('rentals.my-requests.status.' + store.selectedRentalRequest.value.status.toLowerCase())
    }}</span>
    <dl>
      <dt>{{ t('rentals.my-requests.period') }}</dt>
      <dd>
        {{ date(store.selectedRentalRequest.value.period.startDate) }} —
        {{ date(store.selectedRentalRequest.value.period.endDate) }}
      </dd>
      <dt>{{ t('rentals.my-requests.requested-at') }}</dt>
      <dd>{{ date(store.selectedRentalRequest.value.createdAt) }}</dd>
    </dl>
  </section>
  <p v-else-if="!store.loading.value">
    {{ t('rentals.my-requests.detail.not-found-description') }}
  </p>
</template>
