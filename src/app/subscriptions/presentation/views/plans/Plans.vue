<script setup>
import { onMounted, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useServices } from '../../../../app.services.js';
import { date, money } from '../../../../shared/presentation/format.js';
import Feedback from '../../../../shared/presentation/components/feedback/Feedback.vue';
const { iam, subscriptions: store } = useServices();
const { t, tm } = useI18n();
const selected = shallowRef(null);
onMounted(() => {
  store.loadPlans();
  store.loadCurrentSubscription(iam.currentUserId.value);
});
watch(
  () => store.subscriptionLoading.value,
  (busy, wasBusy) => {
    if (wasBusy && !busy && !store.subscriptionError.value) selected.value = null;
  },
);
function confirm() {
  if (!selected.value || store.subscriptionLoading.value) return;
  if (store.currentSubscription.value) store.changePlan(selected.value.id);
  else store.subscribeToPlan(iam.currentUserId.value, selected.value.id);
}
const key = (plan) => plan.name.toLowerCase();
</script>
<template>
  <h1>{{ t('subscriptions.plans.title') }}</h1>
  <p>{{ t('subscriptions.plans.subtitle') }}</p>
  <Feedback
    :loading="store.loading.value || store.subscriptionLoading.value"
    :error="store.error.value || store.subscriptionError.value"
  />
  <section class="card">
    <h2>{{ t('subscriptions.plans.current-plan-title') }}</h2>
    <template v-if="store.currentSubscription.value"
      ><p>
        {{
          t(
            'subscriptions.plans.plan-names.' +
              (store.plans.value
                .find((p) => p.id === store.currentSubscription.value.planId)
                ?.name.toLowerCase() || 'essential'),
          )
        }}
      </p>
      <p>
        {{ date(store.currentSubscription.value.period.startDate) }} —
        {{ date(store.currentSubscription.value.period.endDate) }}
      </p>
      <span class="badge">{{
        t(
          'subscriptions.plans.subscription-status.' +
            store.currentSubscription.value.status.toLowerCase(),
        )
      }}</span>
      <p>
        {{ t('subscriptions.plans.auto-renew') }}:
        {{
          t(
            store.currentSubscription.value.autoRenew
              ? 'subscriptions.plans.enabled'
              : 'subscriptions.plans.disabled',
          )
        }}
      </p></template
    >
    <p v-else>{{ t('subscriptions.plans.no-current-plan-description') }}</p>
  </section>
  <div class="cards">
    <article
      v-for="plan in store.plans.value"
      :key="plan.id"
      class="card plan"
      :class="{ recommended: plan.id === 2 }"
    >
      <span v-if="plan.id === 2" class="badge">{{ t('subscriptions.plans.recommended') }}</span>
      <h2>{{ t('subscriptions.plans.plan-names.' + key(plan)) }}</h2>
      <p>{{ t('subscriptions.plans.descriptions.' + key(plan)) }}</p>
      <p class="price">
        {{ money(plan.price.amount, plan.price.currency) }}
        <small>{{ t('subscriptions.plans.per-month') }}</small>
      </p>
      <ul>
        <li
          v-for="(feature, index) in tm('subscriptions.plans.features.' + key(plan))"
          :key="index"
        >
          {{ feature }}
        </li>
      </ul>
      <button
        :disabled="
          store.subscriptionLoading.value || store.currentSubscription.value?.planId === plan.id
        "
        @click="selected = plan"
      >
        {{
          t(
            store.currentSubscription.value?.planId === plan.id
              ? 'subscriptions.plans.current-plan-button'
              : store.currentSubscription.value
                ? 'subscriptions.plans.change-plan'
                : 'subscriptions.plans.select-plan',
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
            ? 'subscriptions.plans.change-confirmation-title'
            : 'subscriptions.plans.confirmation-title',
        )
      }}
    </h2>
    <p>
      {{ t('subscriptions.plans.plan-names.' + key(selected)) }} ·
      {{ money(selected.price.amount, selected.price.currency) }}
    </p>
    <div class="actions">
      <button :disabled="store.subscriptionLoading.value" @click="confirm">
        {{ t('common.confirm') }}</button
      ><button
        class="secondary"
        :disabled="store.subscriptionLoading.value"
        @click="selected = null"
      >
        {{ t('common.cancel') }}
      </button>
    </div>
  </section>
</template>
