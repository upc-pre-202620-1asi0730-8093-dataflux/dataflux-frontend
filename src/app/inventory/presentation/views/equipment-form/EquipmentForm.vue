<script setup>
import { reactive, ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useServices } from "../../../../app.services.js";
import { Equipment } from "../../../domain/model/equipment.entity.js";
import { RentalRate } from "../../../domain/value-object/rental-rate.value-object.js";
import Feedback from "../../../../shared/presentation/components/feedback/Feedback.vue";
const { iam, inventory: store } = useServices();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const id = Number(route.params.id);
const editing = Boolean(route.params.id);
const ready = ref(!editing);
const error = ref(null);
let original;
let subscription;
const form = reactive({
  code: "",
  name: "",
  description: "",
  categoryId: 0,
  location: "",
  dailyRate: null,
  weeklyRate: null,
  currency: "PEN",
});
store.clearSaveState();
onMounted(() => {
  if (editing)
    subscription = store
      .getEquipmentForEdit(id, iam.currentUserId.value)
      .subscribe({
        next: (item) => {
          original = item;
          for (const key of [
            "code",
            "name",
            "description",
            "categoryId",
            "location",
          ])
            form[key] = item[key];
          form.dailyRate = item.rentalRate.dailyRate;
          form.weeklyRate = item.rentalRate.weeklyRate;
          form.currency = item.rentalRate.currency;
          ready.value = true;
        },
        error: () => {
          error.value = t("equipment.error.edit-load-failed");
        },
      });
});
onUnmounted(() => subscription?.unsubscribe());
watch(
  () => store.saveSucceeded.value,
  (success) => {
    if (success) router.push("/inventory/equipment");
  },
);
watch(
  () => store.accessDenied.value,
  (denied) => {
    if (denied) router.push("/subscriptions/plans");
  },
);
function submit() {
  error.value = null;
  if (
    !ready.value ||
    !form.categoryId ||
    !["code", "name", "description", "location"].every((key) =>
      form[key].trim(),
    ) ||
    form.dailyRate <= 0 ||
    form.weeklyRate <= 0
  ) {
    error.value = t("common.invalid");
    return;
  }
  try {
    const item = new Equipment({
      id: editing ? id : 0,
      userId: iam.currentUserId.value,
      ...form,
      rentalRate: new RentalRate({
        dailyRate: form.dailyRate,
        weeklyRate: form.weeklyRate,
        currency: form.currency,
      }),
      status: original?.status,
      availabilityBlocks: original?.availabilityBlocks ?? [],
    });
    if (editing) store.updateEquipment(item);
    else store.addEquipment(item);
  } catch (e) {
    error.value = e.message;
  }
}
</script>
<template>
  <h1>{{ t(editing ? "equipment.edit-title" : "equipment.new-title") }}</h1>
  <Feedback
    :loading="store.loading.value || (!ready && !error)"
    :error="error || store.error.value"
  />
  <form class="card" @submit.prevent="submit">
    <fieldset :disabled="!ready || store.loading.value">
      <div class="form-grid">
        <label
          v-for="key in ['code', 'name', 'description', 'location']"
          :key="key"
          >{{ t("equipment." + key)
          }}<pv-textarea
            v-if="key === 'description'"
            v-model="form[key]"
            required /><pv-input-text
            v-else
            v-model="form[key]"
            required /></label
        ><label
          >{{ t("equipment.category")
          }}<select
            :aria-label="t('equipment.category')"
            v-model.number="form.categoryId"
            required
          >
            <option :value="0" disabled>—</option>
            <option
              v-for="category in store.categories.value"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select></label
        ><label
          >{{ t("equipment.daily-rate")
          }}<input
            v-model.number="form.dailyRate"
            type="number"
            min="0.01"
            step="0.01"
            required /></label
        ><label
          >{{ t("equipment.weekly-rate")
          }}<input
            v-model.number="form.weeklyRate"
            type="number"
            min="0.01"
            step="0.01"
            required
        /></label>
        <label
          >{{ t("equipment.currency") }}
          <select v-model="form.currency" :aria-label="t('equipment.currency')">
            <option value="PEN">PEN</option>
            <option value="USD">USD</option>
          </select>
        </label>
      </div>
      <pv-button type="submit">{{
        t(editing ? "equipment.update" : "equipment.create")
      }}</pv-button>
    </fieldset>
    <RouterLink to="/inventory/equipment">{{ t("common.cancel") }}</RouterLink>
  </form>
</template>
