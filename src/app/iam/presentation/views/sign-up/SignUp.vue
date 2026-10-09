<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import { resolveRegistrationRole } from "../../registration-role.js";
import { useServices } from "../../../../app.services.js";
import { SignUpCommand } from "../../../domain/model/sign-up.command.js";
import LanguageSwitcher from "../../../../shared/presentation/components/language-switcher/LanguageSwitcher.vue";
import Feedback from "../../../../shared/presentation/components/feedback/Feedback.vue";
const { iam } = useServices();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
iam.clearError();
const form = reactive({
  firstName: "",
  lastName: "",
  companyName: "",
  email: "",
  password: "",
  confirm: "",
  role: resolveRegistrationRole(route.query.role),
});
const error = ref(null);
function submit() {
  if (iam.loading.value) return;
  error.value = null;
  if (form.password !== form.confirm) {
    error.value = t("sign-up.passwords-do-not-match");
    return;
  }
  if (
    ![form.firstName, form.lastName, form.companyName].every((value) =>
      value.trim(),
    )
  ) {
    error.value = t("common.invalid");
    return;
  }
  iam.signUp(
    new SignUpCommand({ ...form, email: form.email.trim().toLowerCase() }),
    router,
  );
}
</script>
<template>
  <main id="main-content" class="auth-page" tabindex="-1">
    <section class="brand-panel">
      <img src="/rentbuild-logo.png" alt="RentBuild" class="logo" />
      <div>
        <span class="eyebrow">{{ t("iam.auth.hero-badge") }}</span>
        <h1>{{ t("iam.auth.hero-title-line-1") }}</h1>
        <p>{{ t("iam.auth.hero-description") }}</p>
      </div>
      <small>RentBuild</small>
    </section>
    <section class="auth-panel">
      <LanguageSwitcher />
      <div class="auth-card">
        <h2>{{ t("sign-up.title") }}</h2>
        <p>{{ t("sign-up.subtitle") }}</p>
        <Feedback
          :loading="iam.loading.value"
          :error="error || iam.error.value"
        />
        <form @submit.prevent="submit" :aria-busy="iam.loading.value">
          <fieldset :disabled="iam.loading.value">
            <div class="form-grid">
              <label for="sign-up-first-name"
                >{{ t("sign-up.first-name")
                }}<InputText
                  id="sign-up-first-name"
                  v-model="form.firstName"
                  required
                  autocomplete="given-name" /></label
              ><label for="sign-up-last-name"
                >{{ t("sign-up.last-name")
                }}<InputText
                  id="sign-up-last-name"
                  v-model="form.lastName"
                  required
                  autocomplete="family-name"
              /></label>
            </div>
            <label for="sign-up-company-name"
              >{{ t("sign-up.company-name")
              }}<InputText
                id="sign-up-company-name"
                v-model="form.companyName"
                required
                autocomplete="organization" /></label
            ><label for="sign-up-email"
              >{{ t("sign-up.email")
              }}<InputText
                id="sign-up-email"
                v-model="form.email"
                required
                type="email"
                autocomplete="email" /></label
            ><label for="sign-up-role"
              >{{ t("sign-up.organization-type")
              }}<select id="sign-up-role" v-model="form.role">
                <option value="construction_company">
                  {{ t("sign-up.construction-company") }}
                </option>
                <option value="rental_company">
                  {{ t("sign-up.rental-company") }}
                </option>
              </select></label
            >
            <div class="form-grid">
              <label for="sign-up-password"
                >{{ t("sign-up.password")
                }}<InputText
                  id="sign-up-password"
                  v-model="form.password"
                  required
                  minlength="8"
                  type="password"
                  autocomplete="new-password" /></label
              ><label for="sign-up-confirm"
                >{{ t("sign-up.confirm-password")
                }}<InputText
                  id="sign-up-confirm"
                  v-model="form.confirm"
                  required
                  minlength="8"
                  type="password"
                  autocomplete="new-password"
              /></label>
            </div>
            <Button
              type="submit"
              :disabled="iam.loading.value"
              :label="t('sign-up.create-account')"
            />
          </fieldset>
        </form>
        <p>
          {{ t("sign-up.already-account") }}
          <RouterLink to="/iam/sign-in">{{ t("sign-up.sign-in") }}</RouterLink>
        </p>
      </div>
    </section>
  </main>
</template>
