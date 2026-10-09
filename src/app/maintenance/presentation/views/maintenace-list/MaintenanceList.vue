<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useServices } from '../../../../app.services.js';
import { date } from '../../../../shared/presentation/format.js';
import Feedback from '../../../../shared/presentation/components/feedback/Feedback.vue';
import MaintenanceForm from '../../components/maintenance-form/MaintenanceForm.vue';
const { iam, maintenance: store } = useServices();
const { t } = useI18n();
const mode = ref(null);
const filter = ref('');
const records = computed(() =>
  store.maintenances.value.filter((item) => !filter.value || item.status === filter.value),
);
onMounted(() => {
  store.clearSaveState();
  store.loadForCompany(iam.currentUserId.value);
});
watch(
  () => store.saveSucceeded.value,
  (success) => {
    if (success) mode.value = null;
  },
);
function open(value) {
  store.clearSaveState();
  mode.value = value;
}
function submit(value) {
  if (store.saving.value) return;
  if (mode.value === 'schedule')
    store.scheduleMaintenance(iam.currentUserId.value, value.equipmentId, value.date, value.type);
  else
    store.registerMaintenance(iam.currentUserId.value, value.equipmentId, value.date, value.type);
}
</script>
<template>
  <div class="page-heading">
    <h1>{{ t('maintenance.list.title') }}</h1>
    <RouterLink to="/maintenance/incidents">{{ t('maintenance.incidents.list.title') }}</RouterLink>
  </div>
  <p>{{ t('maintenance.schedule.list.subtitle') }}</p>
  <div class="stats">
    <article class="card">
      <span>{{ t('maintenance.list.total') }}</span
      ><strong>{{ store.maintenances.value.length }}</strong>
    </article>
    <article class="card">
      <span>{{ t('maintenance.schedule.list.pending') }}</span
      ><strong>{{
        store.maintenances.value.filter((item) => item.status === 'SCHEDULED').length
      }}</strong>
    </article>
    <article class="card">
      <span>{{ t('maintenance.list.completed') }}</span
      ><strong>{{
        store.maintenances.value.filter((item) => item.status === 'COMPLETED').length
      }}</strong>
    </article>
  </div>
  <Feedback
    :loading="store.loading.value"
    :error="store.error.value"
    :success="store.saveSucceeded.value"
  />
  <div class="actions">
    <button
      :disabled="!store.equipmentInformation.value.length || store.saving.value"
      @click="open('register')"
    >
      {{ t('maintenance.list.register') }}</button
    ><button
    class="secondary"
    :disabled="!store.equipmentInformation.value.length || store.saving.value"
    @click="open('schedule')"
  >
    {{ t('maintenance.schedule.list.button') }}
  </button>
  </div>
  <p v-if="!store.equipmentInformation.value.length && !store.loading.value">
    {{ t('maintenance.list.no-equipment') }}
    <RouterLink to="/inventory/equipment/new">{{ t('equipment.new') }}</RouterLink>
  </p>
  <MaintenanceForm
    v-if="mode"
    :key="mode"
    :scheduled="mode === 'schedule'"
    :equipment="store.equipmentInformation.value"
    :busy="store.saving.value"
    @submit="submit"
    @cancel="mode = null"
  />
  <div class="filters">
    <label
    >{{ t('maintenance.schedule.list.filter-label')
      }}<select :aria-label="t('maintenance.schedule.list.filter-label')" v-model="filter">
        <option value="">{{ t('common.all') }}</option>
        <option value="SCHEDULED">{{ t('maintenance.status.scheduled') }}</option>
        <option value="COMPLETED">{{ t('maintenance.status.completed') }}</option>
      </select></label
    >
  </div>
  <div class="card table-wrap">
    <table>
      <thead>
      <tr>
        <th>{{ t('maintenance.list.equipment') }}</th>
        <th>{{ t('maintenance.list.date') }}</th>
        <th>{{ t('maintenance.list.type') }}</th>
        <th>{{ t('maintenance.list.status') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in records" :key="item.id">
        <td>
          {{ store.getEquipmentInformation(item.equipmentId)?.name || '#' + item.equipmentId }}
        </td>
        <td>{{ date(item.performedAt) }}</td>
        <td>{{ item.type }}</td>
        <td>
          <span class="badge">{{ t('maintenance.status.' + item.status.toLowerCase()) }}</span>
        </td>
      </tr>
      </tbody>
    </table>
    <p v-if="!records.length && !store.loading.value" class="empty">{{ t('common.empty') }}</p>
  </div>
</template>
