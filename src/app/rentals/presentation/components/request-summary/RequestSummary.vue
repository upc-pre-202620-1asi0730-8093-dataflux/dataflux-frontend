<script setup>
import { useI18n } from 'vue-i18n';
defineProps({ store: { type: Object, required: true } });
const { t } = useI18n();
</script>
<template>
  <div class="stats">
    <article
      v-for="[key, count] in [
        ['pending', store.pendingRequestCount.value],
        ['approved', store.approvedRequestCount.value],
        ['rejected', store.rejectedRequestCount.value],
      ]"
      :key="key"
      class="card"
    >
      <span>{{ t('rentals.requests.summary.' + key) }}</span
      ><strong>{{ count }}</strong>
    </article>
  </div>
</template>
