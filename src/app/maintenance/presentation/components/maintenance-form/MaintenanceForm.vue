<script setup>
import { reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { date, localDate } from '../../../../shared/presentation/format.js';
const props = defineProps({
  equipment: { type: Array, default: () => [] },
  scheduled: Boolean,
  busy: Boolean,
});
const emit = defineEmits(['submit', 'cancel']);
const { t } = useI18n();
const form = reactive({ equipmentId: 0, date: date(new Date()), type: '' });
const prefix = computed(() => (props.scheduled ? 'maintenance.schedule.form' : 'maintenance.form'));
function submit() {
  if (form.equipmentId && form.type.trim())
    emit('submit', {
      equipmentId: form.equipmentId,
      date: localDate(form.date),
      type: form.type.trim(),
    });
}
</script>
<template>
  <form class="card confirmation" @submit.prevent="submit">
    <h2>{{ t(prefix + '.title') }}</h2>
    <p>{{ t(prefix + '.subtitle') }}</p>
    <div class="form-grid">
      <label
      >{{ t('maintenance.form.equipment')
        }}<select
          :aria-label="t('maintenance.form.equipment')"
          v-model.number="form.equipmentId"
          required
        >
          <option :value="0" disabled>—</option>
          <option v-for="item in equipment" :key="item.id" :value="item.id">
            {{ item.name }} · {{ item.code }}
          </option>
        </select></label
      ><label
    >{{ t(prefix + '.date')
      }}<input
        v-model="form.date"
        required
        type="date"
        :min="scheduled ? date(new Date()) : undefined"
        :max="!scheduled ? date(new Date()) : undefined" /></label
    ><label
    >{{ t('maintenance.form.type')
      }}<input v-model="form.type" required :placeholder="t('maintenance.form.type-placeholder')"
      /></label>
    </div>
    <div class="actions">
      <button :disabled="busy || !form.equipmentId || !form.type.trim()">
        {{ t(prefix + '.save') }}</button
      ><button type="button" class="secondary" :disabled="busy" @click="emit('cancel')">
      {{ t('common.cancel') }}
    </button>
    </div>
  </form>
</template>
