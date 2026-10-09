<script setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useServices } from "../../../../app.services.js";
import Feedback from "../../components/feedback/Feedback.vue";
const { t } = useI18n();
const route = useRoute();
const { iam, inventory, rentals, profiles, subscriptions } = useServices();
const rentalCompany = computed(
  () => iam?.currentRole.value === "rental_company",
);
const loading = computed(() => [inventory, rentals, profiles].some((store) => store?.loading.value));
const error = computed(() => inventory?.error.value || rentals?.error.value || profiles?.error.value || subscriptions?.subscriptionError.value);
onMounted(() => {
  const userId = iam?.currentUserId.value;
  if (!userId) return;
  profiles?.loadProfileByUserId(userId);
  if (rentalCompany.value) {
    subscriptions?.loadCurrentSubscription(userId);
    inventory?.loadEquipmentByUserId(userId);
    rentals?.loadRentalRequestsForCompany(userId);
  } else {
    inventory?.loadMarketplaceEquipment();
    rentals?.loadRentalRequestsForConstructionCompany(userId);
  }
});
</script>
<template>
  <span class="eyebrow">{{
      t(
        rentalCompany
          ? "dashboard.rental-company"
          : "dashboard.construction-company",
      )
    }}</span>
  <h1>
    {{
      t(
        rentalCompany
          ? "dashboard.rental-title"
          : "dashboard.construction-title",
      )
    }}
  </h1>
  <p>
    {{ t("dashboard.welcome") }}
    {{ profiles?.profile.value?.companyName || iam?.currentEmail.value }}
  </p>
  <Feedback
    :loading="loading"
    :error="error"
  />
  <p v-if="route.query.access === 'unavailable'" role="alert">{{ t('dashboard.access-unavailable') }}</p>
  <div class="stats">
    <article v-if="inventory" class="card">
      <span>{{ t("navigation.equipment") }}</span
      ><strong>{{ inventory.equipmentCount.value }}</strong>
    </article>
    <article v-if="rentals" class="card">
      <span>{{ t("rentals.requests.summary.pending") }}</span
      ><strong>{{ rentals.pendingRequestCount.value }}</strong>
    </article>
    <article v-if="rentals" class="card">
      <span>{{ t("rentals.requests.summary.approved") }}</span
      ><strong>{{ rentals.approvedRequestCount.value }}</strong>
    </article>
  </div>
  <section class="card">
    <h2>{{ t("navigation.dashboard") }}</h2>
    <div class="actions" v-if="rentalCompany">
      <RouterLink v-if="subscriptions" class="button" to="/subscriptions/plans">{{
          t("navigation.plan-subscription")
        }}</RouterLink
      ><RouterLink v-if="inventory" class="button secondary" to="/inventory/equipment">{{
        t("navigation.equipment")
      }}</RouterLink
    ><RouterLink v-if="rentals" class="button secondary" to="/rentals/requests">{{
        t("navigation.rental-requests")
      }}</RouterLink>
    </div>
    <div class="actions" v-else>
      <RouterLink v-if="inventory" class="button" to="/inventory/search">{{
          t("navigation.search-equipment")
        }}</RouterLink
      ><RouterLink v-if="rentals" class="button secondary" to="/rentals/my-requests">{{
        t("navigation.my-requests")
      }}</RouterLink>
    </div>
  </section>
</template>
