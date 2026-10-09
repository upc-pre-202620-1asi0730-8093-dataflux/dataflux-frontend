<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { date } from '../../../../shared/presentation/format.js';
const props = defineProps({
  store: { type: Object, required: true },
  requests: { type: Array, required: true },
  mine: Boolean,
});
const { t } = useI18n();
const prefix = computed(() => (props.mine ? 'rentals.my-requests' : 'rentals.requests'));
</script>
<template>
  <div class="card table-wrap">
    <table>
      <thead>
        <tr>
          <th>{{ t(prefix + '.equipment') }}</th>
          <th v-if="!mine">{{ t(prefix + '.requester') }}</th>
          <th>{{ t(prefix + '.period') }}</th>
          <th>{{ t(prefix + '.requested-at') }}</th>
          <th>{{ t(prefix + '.status-label') }}</th>
          <th>{{ t(prefix + '.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="request in requests" :key="request.id">
          <td>
            {{
              store.getEquipmentInformation(request.equipmentId)?.name || '#' + request.equipmentId
            }}
          </td>
          <td v-if="!mine">
            {{
              store.getParticipantInformation(request.constructionUserId)?.companyName ||
              '#' + request.constructionUserId
            }}
          </td>
          <td>{{ date(request.period.startDate) }} — {{ date(request.period.endDate) }}</td>
          <td>{{ date(request.createdAt) }}</td>
          <td>
            <span class="badge" :class="request.status.toLowerCase()">{{
              t(prefix + '.status.' + request.status.toLowerCase())
            }}</span>
          </td>
          <td>
            <RouterLink v-if="mine" :to="'/rentals/my-requests/' + request.id">{{
              t(prefix + '.view-detail')
            }}</RouterLink>
            <div v-else-if="request.status === 'PENDING'" class="actions">
              <button
                :disabled="store.updatingRequestId.value !== null"
                @click="store.approveRentalRequest(request.id)"
              >
                {{ t('rentals.requests.approve') }}</button
              ><button
                class="secondary"
                :disabled="store.updatingRequestId.value !== null"
                @click="store.rejectRentalRequest(request.id)"
              >
                {{ t('rentals.requests.reject') }}
              </button>
            </div>
            <span v-else>—</span>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!requests.length && !store.loading.value" class="empty">
      {{ t(prefix + '.empty-title') }}
    </p>
  </div>
</template>
