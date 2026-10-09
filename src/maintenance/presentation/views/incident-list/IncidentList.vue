<script setup>
import { ref, shallowRef, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useServices } from '../../../../app.services.js';
import { date } from '../../../../shared/presentation/format.js';
import Feedback from '../../../../shared/presentation/components/feedback/Feedback.vue';
import IncidentForm from '../../components/incident-form/IncidentForm.vue';
const { iam, incidents: store } = useServices();
const { t } = useI18n();
const showForm = ref(false);
const selected = shallowRef(null);
const action = ref('resolve');
const inspected = ref(false);
const busy = computed(
  () =>
    store.saving.value ||
    store.resolvingIncidentId.value !== null ||
    store.restrictingIncidentId.value !== null ||
    store.reactivatingEquipmentId.value !== null,
);
onMounted(() => {
  store.clearSaveState();
  store.loadForCompany(iam.currentUserId.value);
});
watch(
  () => [
    store.saveSucceeded.value,
    store.resolveSucceeded.value,
    store.restrictionSucceeded.value,
    store.reactivationSucceeded.value,
  ],
  (values) => {
    if (values.some(Boolean)) {
      showForm.value = false;
      selected.value = null;
    }
  },
);
function open(item, type) {
  store.clearSaveState();
  showForm.value = false;
  selected.value = item;
  action.value = type;
  inspected.value = false;
}
function register(value) {
  if (!busy.value)
    store.registerIncident(
      iam.currentUserId.value,
      value.equipmentId,
      value.description,
      value.blocksRental,
    );
}
function confirm() {
  if (!selected.value || busy.value) return;
  const id = iam.currentUserId.value;
  if (action.value === 'resolve') store.resolveIncident(id, selected.value.id);
  else if (action.value === 'restriction') store.requireRentalRestriction(id, selected.value.id);
  else store.reactivateEquipment(id, selected.value.id, inspected.value);
}
</script>
<template>
  <div class="page-heading">
    <h1>{{ t('maintenance.incidents.list.title') }}</h1>
    <RouterLink to="/maintenance">{{
        t('maintenance.incidents.list.view-maintenance')
      }}</RouterLink>
  </div>
  <p>{{ t('maintenance.incidents.list.subtitle') }}</p>
  <Feedback
    :loading="store.loading.value"
    :error="store.error.value"
    :success="
      store.saveSucceeded.value ||
      store.resolveSucceeded.value ||
      store.restrictionSucceeded.value ||
      store.reactivationSucceeded.value
    "
  /><button
  :disabled="!store.equipmentInformation.value.length || busy"
  @click="
      store.clearSaveState();
      showForm = true;
      selected = null;
    "
>
  {{ t('maintenance.incidents.list.register') }}</button
><IncidentForm
  v-if="showForm"
  :equipment="store.equipmentInformation.value"
  :busy="busy"
  @submit="register"
  @cancel="showForm = false"
/>
  <section v-if="selected" class="card confirmation">
    <h2>
      {{
        t(
          'maintenance.incidents.list.' +
          (action === 'resolve'
            ? 'resolve'
            : action === 'restriction'
              ? 'require-restriction'
              : 'reactivate'),
        )
      }}
    </h2>
    <p>
      {{
        t(
          'maintenance.incidents.list.' +
          (action === 'resolve'
            ? 'resolve-warning'
            : action === 'restriction'
              ? 'restriction-warning'
              : 'reactivate-warning'),
        )
      }}
    </p>
    <label v-if="action === 'reactivate'" class="check"
    ><input v-model="inspected" type="checkbox" />{{
        t('maintenance.incidents.list.inspection-confirmed')
      }}</label
    >
    <div class="actions">
      <button :disabled="busy || (action === 'reactivate' && !inspected)" @click="confirm">
        {{ t('common.confirm') }}</button
      ><button class="secondary" :disabled="busy" @click="selected = null">
      {{ t('common.cancel') }}
    </button>
    </div>
  </section>
  <div class="card table-wrap">
    <table>
      <thead>
      <tr>
        <th>{{ t('maintenance.incidents.list.equipment') }}</th>
        <th>{{ t('maintenance.incidents.list.date') }}</th>
        <th>{{ t('maintenance.incidents.list.description') }}</th>
        <th>{{ t('maintenance.incidents.list.status') }}</th>
        <th>{{ t('maintenance.incidents.list.rental-restriction') }}</th>
        <th>{{ t('maintenance.incidents.list.actions') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in store.incidents.value" :key="item.id">
        <td>
          {{ store.getEquipmentInformation(item.equipmentId)?.name || '#' + item.equipmentId }}
        </td>
        <td>{{ date(item.reportedAt) }}</td>
        <td>{{ item.description }}</td>
        <td>{{ t('maintenance.incidents.list.' + item.status.toLowerCase()) }}</td>
        <td>
            <span class="badge" :class="item.blocksRental ? 'maintenance' : 'available'">{{
                t(
                  item.blocksRental
                    ? 'maintenance.incidents.list.blocked'
                    : 'maintenance.incidents.list.not-blocked',
                )
              }}</span>
        </td>
        <td>
          <div v-if="item.status === 'OPEN'" class="actions">
            <button class="secondary" :disabled="busy" @click="open(item, 'resolve')">
              {{ t('maintenance.incidents.list.resolve-short') }}</button
            ><button
            v-if="!item.blocksRental"
            :disabled="busy"
            @click="open(item, 'restriction')"
          >
            {{ t('maintenance.incidents.list.require-restriction') }}
          </button>
          </div>
        </td>
      </tr>
      </tbody>
    </table>
    <p v-if="!store.incidents.value.length && !store.loading.value" class="empty">
      {{ t('maintenance.incidents.list.empty-description') }}
    </p>
  </div>
  <section class="card">
    <h2>{{ t('maintenance.incidents.list.reactivation-title') }}</h2>
    <p>{{ t('maintenance.incidents.list.reactivation-description') }}</p>
    <div v-for="item in store.reactivatableEquipment.value" :key="item.id" class="page-heading">
      <span>{{ item.name }}</span
      ><button class="secondary" :disabled="busy" @click="open(item, 'reactivate')">
      {{ t('maintenance.incidents.list.reactivate') }}
    </button>
    </div>
  </section>
</template>
