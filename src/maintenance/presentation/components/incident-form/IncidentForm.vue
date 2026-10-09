<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
defineProps({ equipment: { type: Array, default: () => [] }, busy: Boolean });
const emit = defineEmits(['submit', 'cancel']);
const { t } = useI18n();
const form = reactive({ equipmentId: 0, description: '', blocksRental: false });
function submit() {
  if (form.equipmentId && form.description.trim())
    emit('submit', { ...form, description: form.description.trim() });
}
</script>
<template>
  <form class="card confirmation" @submit.prevent="submit">
    <h2>{{ t('maintenance.incidents.form.title') }}</h2>
    <label
    >{{ t('maintenance.incidents.form.equipment')
      }}<select
        :aria-label="t('maintenance.incidents.form.equipment')"
        v-model.number="form.equipmentId"
        required
      >
        <option :value="0" disabled>—</option>
        <option v-for="item in equipment" :key="item.id" :value="item.id">
          {{ item.name }} · {{ item.code }}
        </option>
      </select></label
    ><label
  >{{ t('maintenance.incidents.form.description')
    }}<textarea
      v-model="form.description"
      required
      :placeholder="t('maintenance.incidents.form.description-placeholder')"
    /></label
  ><label class="check"
  ><input v-model="form.blocksRental" type="checkbox" />{{
      t('maintenance.incidents.form.block-rental')
    }}</label
  >
    <p>{{ t('maintenance.incidents.form.block-rental-hint') }}</p>
    <div class="actions">
      <button :disabled="busy || !form.equipmentId || !form.description.trim()">
        {{ t('maintenance.incidents.form.save') }}</button
      ><button type="button" class="secondary" :disabled="busy" @click="emit('cancel')">
      {{ t('common.cancel') }}
    </button>
    </div>
  </form>
</template>
