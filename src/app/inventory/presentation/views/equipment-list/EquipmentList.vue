<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useServices } from '../../../../app.services.js';
import { useEquipmentFilter } from '../../use-equipment-filter.js';
import { money } from '../../../../shared/presentation/format.js';
import EquipmentFilter from '../../components/equipment-filter/EquipmentFilter.vue';
import AvailabilityBadge from '../../components/availability-badge/AvailabilityBadge.vue';
import Feedback from '../../../../shared/presentation/components/feedback/Feedback.vue';
const { iam, inventory: store } = useServices();
const { t } = useI18n();
const { filters, equipment } = useEquipmentFilter(store);
onMounted(() => store.loadEquipmentByUserId(iam.currentUserId.value));
</script>
<template>
  <div class="page-heading">
    <h1>{{ t('equipment.list-title') }}</h1>
    <RouterLink class="button" to="/inventory/equipment/new">{{ t('equipment.new') }}</RouterLink>
  </div>
  <Feedback :loading="store.loading.value" :error="store.error.value" /><EquipmentFilter
    v-model="filters"
    :categories="store.categories.value"
/>
  <div class="card table-wrap">
    <table>
      <thead>
      <tr>
        <th>{{ t('equipment.code') }}</th>
        <th>{{ t('equipment.name') }}</th>
        <th>{{ t('equipment.category') }}</th>
        <th>{{ t('equipment.daily-rate') }}</th>
        <th>{{ t('equipment.availability') }}</th>
        <th>{{ t('equipment.actions') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in equipment" :key="item.id">
        <td>{{ item.code }}</td>
        <td>{{ item.name }}</td>
        <td>{{ item.category?.name || '—' }}</td>
        <td>{{ money(item.rentalRate.dailyRate) }}</td>
        <td><AvailabilityBadge :equipment="item" /></td>
        <td>
          <div class="actions">
            <RouterLink :to="'/inventory/equipment/' + item.id">{{
                t('common.detail')
              }}</RouterLink
            ><RouterLink :to="'/inventory/equipment/' + item.id + '/edit'">{{
              t('equipment.edit')
            }}</RouterLink>
          </div>
        </td>
      </tr>
      </tbody>
    </table>
    <p v-if="!equipment.length && !store.loading.value" class="empty">{{ t('equipment.empty') }}</p>
  </div>
</template>
