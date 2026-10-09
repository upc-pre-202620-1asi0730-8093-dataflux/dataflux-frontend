<script setup>
import { computed, reactive, ref, onMounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import { useServices } from "../../../../app.services.js";
import { CompanyProfile } from "../../../domain/model/company-profile.entity.js";
import { Address } from "../../../domain/value-object/address.value-object.js";
import Feedback from "../../../../shared/presentation/components/feedback/Feedback.vue";
const { iam, profiles: store } = useServices();
const { t } = useI18n();
const editing = ref(false);
const editTrigger = ref(null);
const saved = ref(false);
const validation = ref(null);
const form = reactive({});
const fields = {
  firstName: "first-name",
  lastName: "last-name",
  contactEmail: "email",
  phoneNumber: "phone-number",
  companyName: "company-name",
};
const addressFields = ["street", "district", "city", "country"];
const groups = [
  { title: "personal-information", keys: ["firstName", "lastName"] },
  { title: "contact-information", keys: ["contactEmail", "phoneNumber"] },
  {
    title: "organization-information",
    keys: ["companyName", ...addressFields],
  },
];
const profile = computed(() => store.profile.value);
function load() {
  store.loadProfileByUserId(iam.currentUserId.value);
}
onMounted(load);
function value(key) {
  return (
    (addressFields.includes(key)
      ? profile.value?.address?.[key]
      : profile.value?.[key]) ||
    (key === "contactEmail" ? iam.currentEmail.value : "") ||
    "—"
  );
}
async function edit() {
  const p = profile.value;
  for (const key of Object.keys(fields)) form[key] = p?.[key] ?? "";
  form.contactEmail ||= iam.currentEmail.value ?? "";
  for (const key of addressFields) form[key] = p?.address?.[key] ?? "";
  validation.value = null;
  saved.value = false;
  editing.value = true;
  await nextTick();
  document.getElementById("profile-firstName")?.focus();
}
async function finishEditing() {
  editing.value = false;
  validation.value = null;
  await nextTick();
  editTrigger.value?.$el?.focus();
}
async function submit() {
  if (store.loading.value) return;
  validation.value = null;
  for (const key of ["firstName", "lastName", "contactEmail", "companyName"]) {
    if (!form[key]?.trim()) {
      validation.value = t("profile.error." + fields[key] + "-required");
      return;
    }
  }
  const p = profile.value;
  const success = await store.updateProfile(
    new CompanyProfile({
      id: p?.id ?? 0,
      userId: iam.currentUserId.value,
      ...Object.fromEntries(
        Object.keys(fields).map((key) => [key, form[key].trim()]),
      ),
      address: new Address({
        ...Object.fromEntries(
          addressFields.map((key) => [key, form[key].trim()]),
        ),
        latitude: p?.address?.latitude ?? 0,
        longitude: p?.address?.longitude ?? 0,
      }),
    }),
  );
  if (success) {
    await finishEditing();
    saved.value = true;
  }
}
</script>
<template>
  <nav class="profile-breadcrumb" :aria-label="t('profile.title')">
    <RouterLink to="/dashboard">{{
      t("subscriptions.plans.workspace")
    }}</RouterLink>
    <span aria-hidden="true">/</span><strong>{{ t("profile.title") }}</strong>
  </nav>
  <h1>{{ t("profile.title") }}</h1>
  <Feedback
    :loading="store.loading.value"
    :error="validation || store.error.value"
    :success="saved"
  />
  <template v-if="!editing && !store.loading.value && !store.error.value">
    <p v-if="!profile" class="notice">{{ t("profile.complete") }}</p>
    <div class="profile-grid">
      <section
        v-for="group in groups"
        :key="group.title"
        class="card profile-card"
        :class="{ organization: group.title === 'organization-information' }"
      >
        <h2>{{ t("profile." + group.title) }}</h2>
        <dl>
          <div v-for="key in group.keys" :key="key" class="profile-row">
            <dt>{{ t("profile." + (fields[key] || key)) }}</dt>
            <dd>{{ value(key) }}</dd>
          </div>
        </dl>
      </section>
    </div>
    <Button
      ref="editTrigger"
      type="button"
      class="secondary"
      @click="edit"
      :label="t('profile.edit')"
    />
  </template>
  <Button
    type="button"
    v-if="store.error.value && !editing && !store.loading.value"
    class="secondary"
    @click="load"
    :label="t('profile.retry')"
  />
  <section v-if="editing" class="card">
    <form @submit.prevent="submit" :aria-busy="store.loading.value">
      <fieldset :disabled="store.loading.value">
        <div class="form-grid">
          <label
            v-for="(label, key) in fields"
            :key="key"
            :for="'profile-' + key"
            >{{ t("profile." + label) }}
            <InputText
              :id="'profile-' + key"
              v-model="form[key]"
              :type="
                key === 'contactEmail'
                  ? 'email'
                  : key === 'phoneNumber'
                    ? 'tel'
                    : 'text'
              "
              :required="key !== 'phoneNumber'"
            />
          </label>
          <label v-for="key in addressFields" :key="key" :for="'profile-' + key"
            >{{ t("profile." + key)
            }}<InputText :id="'profile-' + key" v-model="form[key]"
          /></label>
        </div>
        <div class="actions">
          <Button
            type="submit"
            :disabled="store.loading.value"
            :label="t('profile.save')"
          />
          <Button
            type="button"
            class="secondary"
            :disabled="store.loading.value"
            @click="finishEditing"
            :label="t('profile.cancel')"
          />
        </div>
      </fieldset>
    </form>
  </section>
</template>
<style scoped>
.profile-breadcrumb {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 22px;
  font-size: 0.9rem;
  color: #637184;
}
.profile-breadcrumb a {
  color: #637184;
}
.profile-breadcrumb strong {
  color: var(--dark);
}
.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin: 20px 0;
}
.profile-card {
  margin: 0;
  min-width: 0;
  border-radius: 18px;
}
.profile-card h2 {
  margin: 0 0 12px;
}
.profile-card dl {
  display: block;
  margin: 0;
}
.organization {
  grid-column: 1 / -1;
}
.profile-row {
  display: grid;
  grid-template-columns: minmax(100px, 180px) minmax(0, 1fr);
  gap: 20px;
  padding: 19px 0;
}
.profile-row + .profile-row {
  border-top: 1px solid var(--border);
}
.profile-row:last-child {
  padding-bottom: 0;
}
.profile-row dt {
  font-size: 0.9rem;
}
.profile-row dd {
  margin: 0;
}
@media (max-width: 1000px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 420px) {
  .profile-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
