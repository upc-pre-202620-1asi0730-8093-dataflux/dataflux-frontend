<script setup>
import { useI18n } from 'vue-i18n';
defineProps({
  modelValue: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue']);
const { t } = useI18n();
function update(model, key, value) {
  emit('update:modelValue', { ...model, [key]: value });
}
</script>
<template>
  <div class="filters">
    <label
    >{{ t('common.search')
      }}<input
          :value="modelValue.query"
          :placeholder="t('equipment.search.query-placeholder')"
          @input="update(modelValue, 'query', $event.target.value)" /></label
    ><label
  >{{ t('equipment.category')
    }}<select
        :value="modelValue.categoryId"
        @change="update(modelValue, 'categoryId', Number($event.target.value))"
    >
      <option :value="0">{{ t('equipment.search.all-categories') }}</option>
      <option v-for="category in categories" :key="category.id" :value="category.id">
        {{ category.name }}
      </option>
    </select></label
  ><label
  >{{ t('equipment.location')
    }}<input
        :value="modelValue.location"
        @input="update(modelValue, 'location', $event.target.value)" /></label
  ><label
  >{{ t('equipment.availability')
    }}<select
        :value="modelValue.status"
        @change="update(modelValue, 'status', $event.target.value)"
    >
      <option value="">{{ t('common.all') }}</option>
      <option
          v-for="status in ['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE']"
          :key="status"
          :value="status"
      >
        {{ t('equipment.availability-values.' + status.toLowerCase()) }}
      </option>
    </select></label
  ><button
      class="secondary"
      @click="emit('update:modelValue', { query: '', categoryId: 0, location: '', status: '' })"
  >
    {{ t('equipment.search.clear') }}
  </button>
  </div>
</template>
