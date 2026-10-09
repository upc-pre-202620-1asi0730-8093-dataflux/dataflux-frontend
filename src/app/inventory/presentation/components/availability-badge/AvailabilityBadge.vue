<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
const props = defineProps({ equipment: { type: Object, required: true } });
const { t } = useI18n();
const status = computed(() =>
    props.equipment.status === 'AVAILABLE' && props.equipment.isReservedOn(new Date())
        ? 'RESERVED'
        : props.equipment.status,
);
</script>
<template>
  <span class="badge" :class="status.toLowerCase()">{{
      t('equipment.availability-values.' + status.toLowerCase())
    }}</span>
</template>
