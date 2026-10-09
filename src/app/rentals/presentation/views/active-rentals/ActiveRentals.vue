<script setup>
import { onMounted, shallowRef, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useServices } from '../../../../app.services.js';
import { date } from '../../../../shared/presentation/format.js';
import Feedback from '../../../../shared/presentation/components/feedback/Feedback.vue';
import OperationForm from '../../components/operation-form/OperationForm.vue';
const { iam, rentals: store } = useServices();
const { t } = useI18n();
const selected = shallowRef(null);
const operation = ref('delivery');
onMounted(() => {
  store.clearOperationFeedback();
  store.loadActiveRentalsForCompany(iam.currentUserId.value);
});
watch(
  () => store.operationSuccess.value,
  (success) => {
    if (success) selected.value = null;
  },
);
function open(item, type) {
  store.clearOperationFeedback();
  selected.value = item;
  operation.value = type;
}
function submit(value) {
  if (!selected.value || store.updatingRentalId.value !== null) return;
  if (operation.value === 'delivery')
    store.registerDelivery(selected.value.id, value.date, value.notes);
  else store.registerReturn(selected.value.id, value.date, value.notes, value.maintenanceRequired);
}
function indicator(item) {
  if (item.isConfirmed) return 'awaiting-delivery';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(item.period.endDate);
  end.setHours(0, 0, 0, 0);
  const days = Math.ceil((end - today) / 86400000);
  return days < 0 ? 'overdue' : days <= 7 ? 'due-soon' : 'scheduled';
}
</script>
<template>
  <h1>{{ t('rentals.active.title') }}</h1>
  <p>{{ t('rentals.active.subtitle') }}</p>
  <div class="stats">
    <article class="card">
      <span>{{ t('rentals.active.summary-confirmed') }}</span
      ><strong>{{ store.confirmedRentalCount.value }}</strong>
    </article>
    <article class="card">
      <span>{{ t('rentals.active.summary') }}</span
      ><strong>{{ store.activeRentalCount.value }}</strong>
    </article>
    <article class="card">
      <span>{{ t('rentals.active.summary-due-soon') }}</span
      ><strong>{{ store.upcomingReturnCount.value }}</strong
      ><small>{{
        t('rentals.active.overdue-summary', { count: store.overdueRentalCount.value })
      }}</small>
    </article>
  </div>
  <Feedback
    :loading="store.loading.value"
    :error="store.error.value"
    :success="
      store.operationSuccess.value
        ? t(
            'rentals.active.' +
              (store.operationSuccess.value === 'DELIVERY' ? 'delivery' : 'return') +
              '.success',
          )
        : false
    "
  /><OperationForm
    v-if="selected"
    :key="selected.id + operation"
    :operation="operation"
    :busy="store.updatingRentalId.value !== null"
    @submit="submit"
    @cancel="selected = null"
  />
  <div class="card table-wrap">
    <table>
      <thead>
        <tr>
          <th>{{ t('rentals.active.equipment') }}</th>
          <th>{{ t('rentals.active.customer') }}</th>
          <th>{{ t('rentals.active.start-date') }}</th>
          <th>{{ t('rentals.active.return-date') }}</th>
          <th>{{ t('rentals.active.status-label') }}</th>
          <th>{{ t('rentals.active.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in store.rentals.value" :key="item.id">
          <td>
            {{ store.getEquipmentInformation(item.equipmentId)?.name || '#' + item.equipmentId }}
          </td>
          <td>
            {{
              store.getParticipantInformation(item.constructionUserId)?.companyName ||
              '#' + item.constructionUserId
            }}
          </td>
          <td>{{ date(item.period.startDate) }}</td>
          <td>
            {{ date(item.period.endDate) }}<br /><span class="badge" :class="indicator(item)">{{
              t('rentals.active.return-indicator.' + indicator(item))
            }}</span>
          </td>
          <td>{{ t('rentals.active.status.' + item.status.toLowerCase()) }}</td>
          <td>
            <button
              :disabled="store.updatingRentalId.value !== null"
              @click="open(item, item.isConfirmed ? 'delivery' : 'return')"
            >
              {{
                t(
                  item.isConfirmed
                    ? 'rentals.active.register-delivery'
                    : 'rentals.active.register-return',
                )
              }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!store.rentals.value.length && !store.loading.value" class="empty">
      {{ t('rentals.active.empty-description') }}
    </p>
  </div>
</template>
