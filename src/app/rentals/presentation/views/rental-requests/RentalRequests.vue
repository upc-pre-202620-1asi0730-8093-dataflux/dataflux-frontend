<script setup>
import { computed, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useServices } from '../../../../app.services.js';
import { date } from '../../../../shared/presentation/format.js';
import RequestTable from '../../components/request-table/RequestTable.vue';
import RequestSummary from '../../components/request-summary/RequestSummary.vue';
import Feedback from '../../../../shared/presentation/components/feedback/Feedback.vue';
const { iam, rentals: store } = useServices();
const { t } = useI18n();
const filter = reactive({ status: '', date: '' });
const requests = computed(() =>
  store.rentalRequests.value.filter(
    (item) =>
      (!filter.status || item.status === filter.status) &&
      (!filter.date || date(item.createdAt) === filter.date),
  ),
);
onMounted(() => store.loadRentalRequestsForCompany(iam.currentUserId.value));
</script>
<template>
  <span class="eyebrow">{{ t('rentals.requests.section') }}</span>
  <h1>{{ t('rentals.requests.title') }}</h1>
  <p>{{ t('rentals.requests.subtitle') }}</p>
  <RequestSummary :store="store" /><Feedback
    :loading="store.loading.value"
    :error="store.error.value"
  />
  <div class="filters">
    <label
      >{{ t('rentals.requests.filters.status')
      }}<select :aria-label="t('rentals.requests.filters.status')" v-model="filter.status">
        <option value="">{{ t('common.all') }}</option>
        <option v-for="status in ['PENDING', 'APPROVED', 'REJECTED']" :key="status" :value="status">
          {{ t('rentals.requests.status.' + status.toLowerCase()) }}
        </option>
      </select></label
    ><label
      >{{ t('rentals.requests.filters.date') }}<input v-model="filter.date" type="date" /></label
    ><button
      class="secondary"
      @click="
        filter.status = '';
        filter.date = '';
      "
    >
      {{ t('rentals.requests.filters.clear') }}
    </button>
  </div>
  <RequestTable :store="store" :requests="requests" />
</template>
