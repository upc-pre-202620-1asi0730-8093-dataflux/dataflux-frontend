<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { date, localDate } from '../../../../shared/presentation/format.js';
const props = defineProps({ operation: { type: String, required: true }, busy: Boolean });
const emit = defineEmits(['submit', 'cancel']);
const { t } = useI18n();
const form = reactive({ date: date(new Date()), notes: '', maintenanceRequired: false });
function submit() {
  emit('submit', {
    date: localDate(form.date),
    notes: form.notes,
    maintenanceRequired: form.maintenanceRequired,
  });
}
</script>
<template>
  <form class="card confirmation" @submit.prevent="submit">
    <h2>{{ t('rentals.active.' + props.operation + '.title') }}</h2>
    <p>{{ t('rentals.active.' + props.operation + '.subtitle') }}</p>
    <label
      >{{ t('rentals.active.' + props.operation + '.date')
      }}<input v-model="form.date" type="date" required /></label
    ><label>{{ t('rentals.active.notes') }}<textarea v-model="form.notes" /></label
    ><label v-if="operation === 'return'" class="check"
      ><input v-model="form.maintenanceRequired" type="checkbox" />{{
        t('rentals.active.return.maintenance-required')
      }}</label
    >
    <div class="actions">
      <button :disabled="busy">{{ t('rentals.active.' + props.operation + '.confirm') }}</button
      ><button type="button" class="secondary" :disabled="busy" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </button>
    </div>
  </form>
</template>
