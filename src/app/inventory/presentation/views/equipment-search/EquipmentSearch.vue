<script setup>
import { onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useServices } from "../../../../app.services.js";
import { useEquipmentFilter } from "../../use-equipment-filter.js";
import { money } from "../../../../shared/presentation/format.js";
import EquipmentFilter from "../../components/equipment-filter/EquipmentFilter.vue";
import AvailabilityBadge from "../../components/availability-badge/AvailabilityBadge.vue";
import Feedback from "../../../../shared/presentation/components/feedback/Feedback.vue";
const { inventory: store } = useServices();
const { t } = useI18n();
const { filters, equipment } = useEquipmentFilter(store);
const refresh = () => store.loadMarketplaceEquipment(true);
let timer;
onMounted(() => {
  store.loadMarketplaceEquipment();
  window.addEventListener("focus", refresh);
  timer = setInterval(refresh, 30000);
});
onUnmounted(() => {
  window.removeEventListener("focus", refresh);
  clearInterval(timer);
});
</script>
<template>
  <h1>{{ t("navigation.search-equipment") }}</h1>
  <Feedback
    :loading="store.loading.value"
    :error="store.error.value"
  /><EquipmentFilter v-model="filters" :categories="store.categories.value" />
  <div class="cards">
    <article v-for="item in equipment" :key="item.id" class="card">
      <span class="eyebrow">{{ item.category?.name }}</span>
      <h2>{{ item.name }}</h2>
      <p>{{ item.description }}</p>
      <p>{{ item.location }} · {{ item.code }}</p>
      <AvailabilityBadge :equipment="item" />
      <p class="price">
        {{ money(item.rentalRate.dailyRate, item.rentalRate.currency) }}
        <small>{{ t("equipment.daily-rate") }}</small>
      </p>
      <RouterLink
        class="button secondary"
        :to="'/inventory/equipment/' + item.id"
        >{{ t("equipment.detail.view") }}</RouterLink
      >
    </article>
  </div>
  <p v-if="!equipment.length && !store.loading.value" class="empty">
    {{ t("equipment.search.no-results") }}
  </p>
</template>
