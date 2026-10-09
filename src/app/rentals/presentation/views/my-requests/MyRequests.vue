<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useServices } from '../../../../app.services.js';
import RequestTable from '../../components/request-table/RequestTable.vue';
import RequestSummary from '../../components/request-summary/RequestSummary.vue';
import Feedback from '../../../../shared/presentation/components/feedback/Feedback.vue';
const { iam, rentals: store } = useServices();
const { t } = useI18n();
onMounted(() => store.loadRentalRequestsForConstructionCompany(iam.currentUserId.value));
</script>
<template>
  <h1>{{ t('rentals.my-requests.title') }}</h1>
  <p>{{ t('rentals.my-requests.subtitle') }}</p>
  <RequestSummary :store="store" /><Feedback
    :loading="store.loading.value"
    :error="store.error.value"
  /><RequestTable :store="store" :requests="store.rentalRequests.value" mine />
</template>
