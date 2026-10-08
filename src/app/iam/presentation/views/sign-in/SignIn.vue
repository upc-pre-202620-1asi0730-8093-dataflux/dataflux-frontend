<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useServices } from '../../../../app.services.js';
import { SignInCommand } from '../../../domain/model/sign-in.command.js';
import LanguageSwitcher from '../../../../shared/presentation/components/language-switcher/LanguageSwitcher.vue';
import Feedback from '../../../../shared/presentation/components/feedback/Feedback.vue';
const { iam } = useServices();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const form = reactive({ email: '', password: '' });
const visible = ref(false);
iam.clearError();
function submit() {
  iam.signIn(
    new SignInCommand({ email: form.email.trim().toLowerCase(), password: form.password }),
    router,
  );
}
</script>
<template>
  <main class="auth-page">
    <section class="brand-panel">
      <img src="/rentbuild-logo.png" alt="RentBuild" class="logo" />
      <div>
        <span class="eyebrow">{{ t('iam.auth.hero-badge') }}</span>
        <h1>{{ t('iam.auth.hero-title-line-1') }}<br />{{ t('iam.auth.hero-title-line-2') }}</h1>
        <p>{{ t('iam.auth.hero-description') }}</p>
      </div>
      <small>RentBuild</small>
    </section>
    <section class="auth-panel">
      <LanguageSwitcher />
      <div class="auth-card">
        <span class="eyebrow">{{ t('iam.sign-in.welcome-back') }}</span>
        <h2>{{ t('iam.sign-in.card-title') }}</h2>
        <p>{{ t('iam.sign-in.card-subtitle') }}</p>
        <Feedback
          :loading="iam.loading.value"
          :error="iam.error.value"
          :success="route.query.registered ? t('iam.sign-in.registration-success') : false"
        />
        <form @submit.prevent="submit">
          <label
            >{{ t('iam.sign-in.email')
            }}<input v-model="form.email" type="email" required autocomplete="username" /></label
          ><label
            >{{ t('iam.sign-in.password')
            }}<input
              v-model="form.password"
              :type="visible ? 'text' : 'password'"
              required
              autocomplete="current-password" /></label
          ><label class="check"
            ><input v-model="visible" type="checkbox" />{{
              t('iam.sign-in.toggle-password')
            }}</label
          ><button :disabled="iam.loading.value">{{ t('iam.sign-in.submit') }}</button>
        </form>
        <p>
          {{ t('iam.sign-in.no-account') }}
          <RouterLink to="/iam/sign-up">{{ t('iam.sign-in.create-account') }}</RouterLink>
        </p>
      </div>
    </section>
  </main>
</template>
