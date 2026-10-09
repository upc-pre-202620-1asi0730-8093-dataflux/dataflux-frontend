<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import { useServices } from "../../../../app.services.js";
import { SignInCommand } from "../../../domain/model/sign-in.command.js";
import LanguageSwitcher from "../../../../shared/presentation/components/language-switcher/LanguageSwitcher.vue";
import Feedback from "../../../../shared/presentation/components/feedback/Feedback.vue";
const { iam } = useServices();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const form = reactive({ email: "", password: "" });
const visible = ref(false);
iam.clearError();
function submit() {
  if (iam.loading.value) return;
  iam.signIn(
    new SignInCommand({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    }),
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
        <h1>
          {{ t("iam.auth.hero-title-line-1") }}<br />{{
            t("iam.auth.hero-title-line-2")
          }}
        </h1>
        <p>{{ t("iam.auth.hero-description") }}</p>
      </div>
      <small>RentBuild</small>
    </section>
    <section class="auth-panel">
      <LanguageSwitcher />
      <div class="auth-card">
        <span class="eyebrow">{{ t("iam.sign-in.welcome-back") }}</span>
        <h2>{{ t("iam.sign-in.card-title") }}</h2>
        <p>{{ t("iam.sign-in.card-subtitle") }}</p>
        <Feedback
          :loading="iam.loading.value"
          :error="iam.error.value"
          :success="
            route.query.registered
              ? t('iam.sign-in.registration-success')
              : false
          "
        />
        <form @submit.prevent="submit" :aria-busy="iam.loading.value">
          <fieldset :disabled="iam.loading.value">
            <label for="sign-in-email"
              >{{ t("iam.sign-in.email") }}
              <InputText
                id="sign-in-email"
                v-model="form.email"
                type="email"
                required
                autocomplete="username"
              />
            </label>
            <label for="sign-in-password"
              >{{ t("iam.sign-in.password") }}
              <InputText
                id="sign-in-password"
                v-model="form.password"
                :type="visible ? 'text' : 'password'"
                required
                autocomplete="current-password"
              />
            </label>
            <label class="check" for="sign-in-visible">
              <input id="sign-in-visible" v-model="visible" type="checkbox" />{{
                t("iam.sign-in.toggle-password")
              }}
            </label>
            <Button
              type="submit"
              :disabled="iam.loading.value"
              :label="t('iam.sign-in.submit')"
            />
          </fieldset>
        </form>
        <p>
          {{ t("iam.sign-in.no-account") }}
          <RouterLink to="/iam/sign-up">{{
            t("iam.sign-in.create-account")
          }}</RouterLink>
        </p>
      </div>
    </section>
  </main>
</template>
