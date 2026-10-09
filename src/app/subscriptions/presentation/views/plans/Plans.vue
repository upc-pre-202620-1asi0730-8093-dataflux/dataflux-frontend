<script setup>
import { computed, onMounted, shallowRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useServices } from "../../../../app.services.js";
import { date, money, subscriptionErrorKey } from "../../format.js";
import Feedback from "../../../../shared/presentation/components/feedback/Feedback.vue";

const { iam, subscriptions: store } = useServices();
const { t, tm, te, locale } = useI18n();
const selected = shallowRef(null);
const confirmingPlanId = shallowRef(null);
const saved = shallowRef(false);
const subscriptionErrorFallback = shallowRef(
  "subscriptions.plans.errors.load-current",
);
const busy = computed(
  () => store.loading.value || store.subscriptionLoading.value,
);
const error = computed(() => {
  const messageKey = store.error.value
    ? subscriptionErrorKey(store.error.value, "subscriptions.plans.load-error")
    : subscriptionErrorKey(
        store.subscriptionError.value,
        subscriptionErrorFallback.value,
      );
  return messageKey ? t(messageKey) : null;
});
const blocked = computed(() => busy.value || Boolean(error.value));
const currentPlan = computed(() =>
  store.plans.value.find(
    (plan) => plan.id === store.currentSubscription.value?.planId,
  ),
);

function load() {
  if (busy.value) return;
  selected.value = null;
  saved.value = false;
  subscriptionErrorFallback.value = "subscriptions.plans.errors.load-current";
  store.loadPlans();
  store.loadCurrentSubscription(iam.currentUserId.value);
}
onMounted(load);

watch(
  () => store.subscriptionLoading.value,
  (loading, wasLoading) => {
    if (loading || !wasLoading || confirmingPlanId.value === null) return;
    if (
      !store.subscriptionError.value &&
      store.currentSubscription.value?.planId === confirmingPlanId.value
    ) {
      saved.value = true;
      selected.value = null;
    }
    confirmingPlanId.value = null;
  },
  { flush: "sync" },
);

function confirm() {
  if (!selected.value || blocked.value || confirmingPlanId.value !== null)
    return;
  saved.value = false;
  confirmingPlanId.value = selected.value.id;
  const changing = Boolean(store.currentSubscription.value);
  subscriptionErrorFallback.value = changing
    ? "subscriptions.plans.errors.update"
    : "subscriptions.plans.errors.create";
  if (changing) store.changePlan(selected.value.id);
  else store.subscribeToPlan(iam.currentUserId.value, selected.value.id);
  if (!store.subscriptionLoading.value) confirmingPlanId.value = null;
}

const key = (plan) => String(plan.name ?? "").toLowerCase();
function planName(plan) {
  if (!plan) return t("subscriptions.plans.unknown-plan");
  const messageKey = "subscriptions.plans.plan-names." + key(plan);
  return te(messageKey) ? t(messageKey) : plan.name;
}
function featureKeys(plan) {
  const features = tm("subscriptions.plans.features." + key(plan));
  return features && typeof features === "object" ? Object.keys(features) : [];
}
function isCurrent(plan) {
  const subscription = store.currentSubscription.value;
  return subscription?.planId === plan.id && subscription.isActive();
}
function select(plan) {
  if (blocked.value || isCurrent(plan)) return;
  selected.value = plan;
  saved.value = false;
}
</script>
<template>
  <h1>{{ t("subscriptions.plans.title") }}</h1>
  <p>{{ t("subscriptions.plans.subtitle") }}</p>
  <p class="notice">{{ t("subscriptions.plans.demo-notice") }}</p>
  <Feedback
    :loading="busy"
    :error="error"
    :success="saved && !error ? t('subscriptions.plans.save-success') : false"
  />
  <button v-if="error" class="secondary" :disabled="busy" @click="load">
    {{ t("subscriptions.plans.retry") }}
  </button>
  <section class="card">
    <h2>{{ t("subscriptions.plans.current-plan-title") }}</h2>
    <template v-if="store.currentSubscription.value">
      <p>{{ planName(currentPlan) }}</p>
      <p>
        {{ t("subscriptions.plans.subscription-period") }}:
        {{ date(store.currentSubscription.value.period.startDate, locale) }} —
        {{ date(store.currentSubscription.value.period.endDate, locale) }}
      </p>
      <span class="badge">{{
        t(
          "subscriptions.plans.subscription-status." +
            store.currentSubscription.value.status.toLowerCase(),
        )
      }}</span>
      <p>
        {{ t("subscriptions.plans.demo-renewal-label") }}:
        {{
          t(
            store.currentSubscription.value.autoRenew
              ? "subscriptions.plans.enabled"
              : "subscriptions.plans.disabled",
          )
        }}
      </p>
      <p>{{ t("subscriptions.plans.demo-renewal-help") }}</p>
    </template>
    <p
      v-else-if="
        !store.subscriptionLoading.value && !store.subscriptionError.value
      "
    >
      {{ t("subscriptions.plans.no-current-plan-description") }}
    </p>
  </section>
  <p
    v-if="
      !store.loading.value && !store.error.value && !store.plans.value.length
    "
    class="notice"
  >
    {{ t("subscriptions.plans.empty") }}
  </p>
  <div class="cards">
    <article
      v-for="plan in store.plans.value"
      :key="plan.id"
      class="card plan"
      :class="{ recommended: plan.id === 2 }"
    >
      <span v-if="plan.id === 2" class="badge">{{
        t("subscriptions.plans.recommended")
      }}</span>
      <h2>{{ planName(plan) }}</h2>
      <p>{{ t("subscriptions.plans.descriptions." + key(plan)) }}</p>
      <p class="price">
        {{ money(plan.price.amount, plan.price.currency, locale) }}
        <small>{{ t("subscriptions.plans.per-month") }}</small>
      </p>
      <ul>
        <li v-for="feature in featureKeys(plan)" :key="feature">
          {{ t("subscriptions.plans.features." + key(plan) + "." + feature) }}
        </li>
      </ul>
      <button :disabled="blocked || isCurrent(plan)" @click="select(plan)">
        {{
          t(
            isCurrent(plan)
              ? "subscriptions.plans.current-plan-button"
              : store.currentSubscription.value
                ? "subscriptions.plans.change-plan"
                : "subscriptions.plans.select-plan",
          )
        }}
      </button>
    </article>
  </div>
  <section v-if="selected" class="card confirmation">
    <h2>
      {{
        t(
          store.currentSubscription.value
            ? "subscriptions.plans.change-confirmation-title"
            : "subscriptions.plans.confirmation-title",
        )
      }}
    </h2>
    <p>
      {{ planName(selected) }} ·
      {{ money(selected.price.amount, selected.price.currency, locale) }}
    </p>
    <p>{{ t("subscriptions.plans.confirm-demo-description") }}</p>
    <p>
      {{
        t(
          store.currentSubscription.value
            ? "subscriptions.plans.keep-period-description"
            : "subscriptions.plans.new-period-description",
        )
      }}
    </p>
    <div class="actions">
      <button :disabled="blocked" @click="confirm">
        {{ t("common.confirm") }}
      </button>
      <button class="secondary" :disabled="busy" @click="selected = null">
        {{ t("common.cancel") }}
      </button>
    </div>
  </section>
</template>
