<script setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useServices } from "../../../../app.services.js";
import Feedback from "../../components/feedback/Feedback.vue";
const { t } = useI18n();
const { iam, inventory, rentals, profiles, subscriptions } = useServices();
const rentalCompany = computed(
  () => iam.currentRole.value === "rental_company",
);
onMounted(() => {
  profiles.loadProfileByUserId(iam.currentUserId.value);
  if (rentalCompany.value) {
    subscriptions.loadCurrentSubscription(iam.currentUserId.value);
    inventory.loadEquipmentByUserId(iam.currentUserId.value);
    rentals.loadRentalRequestsForCompany(iam.currentUserId.value);
  } else {
    inventory.loadMarketplaceEquipment();
    rentals.loadRentalRequestsForConstructionCompany(iam.currentUserId.value);
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
    {{ profiles.profile.value?.companyName || iam.currentEmail.value }}
  </p>
  <Feedback
    :loading="
      inventory.loading.value || rentals.loading.value || profiles.loading.value
    "
    :error="
      inventory.error.value ||
      rentals.error.value ||
      profiles.error.value ||
      subscriptions.subscriptionError.value
    "
  />
  <div class="stats">
    <article class="card">
      <span>{{ t("navigation.equipment") }}</span
      ><strong>{{ inventory.equipmentCount.value }}</strong>
    </article>
    <article class="card">
      <span>{{ t("rentals.requests.summary.pending") }}</span
      ><strong>{{ rentals.pendingRequestCount.value }}</strong>
    </article>
    <article class="card">
      <span>{{ t("rentals.requests.summary.approved") }}</span
      ><strong>{{ rentals.approvedRequestCount.value }}</strong>
    </article>
  </div>
  <section class="card">
    <h2>{{ t("navigation.dashboard") }}</h2>
    <div class="actions" v-if="rentalCompany">
      <RouterLink class="button" to="/subscriptions/plans">{{
          t("navigation.plan-subscription")
        }}</RouterLink
      ><RouterLink class="button secondary" to="/inventory/equipment">{{
        t("navigation.equipment")
      }}</RouterLink
    ><RouterLink class="button secondary" to="/rentals/requests">{{
        t("navigation.rental-requests")
      }}</RouterLink>
    </div>
    <div class="actions" v-else>
      <RouterLink class="button" to="/inventory/search">{{
          t("navigation.search-equipment")
        }}</RouterLink
      ><RouterLink class="button secondary" to="/rentals/my-requests">{{
        t("navigation.my-requests")
      }}</RouterLink>
    </div>
  </section>
</template>
