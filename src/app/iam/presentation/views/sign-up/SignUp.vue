<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useServices } from '../../../../app.services.js';
import { SignUpCommand } from '../../../domain/model/sign-up.command.js';
import LanguageSwitcher from '../../../../shared/presentation/components/language-switcher/LanguageSwitcher.vue';
import Feedback from '../../../../shared/presentation/components/feedback/Feedback.vue';
const { iam } = useServices();
const { t } = useI18n();
const router = useRouter();
iam.clearError();
const form = reactive({
  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
  password: '',
  confirm: '',
  role: 'construction_company',
});
const error = ref(null);
function submit() {
  error.value = null;
  if (form.password !== form.confirm) {
    error.value = t('sign-up.passwords-do-not-match');
    return;
  }
  if (![form.firstName, form.lastName, form.companyName].every((value) => value.trim())) {
    error.value = t('common.invalid');
    return;
  }
  iam.signUp(new SignUpCommand({ ...form, email: form.email.trim().toLowerCase() }), router);
}
</script>
<template>
  <main class="auth-page">
    <section class="brand-panel">
      <img src="/rentbuild-logo.png" alt="RentBuild" class="logo" />
      <div>
        <span class="eyebrow">{{ t('iam.auth.hero-badge') }}</span>
        <h1>{{ t('iam.auth.hero-title-line-1') }}</h1>
        <p>{{ t('iam.auth.hero-description') }}</p>
      </div>
      <small>RentBuild</small>
    </section>
    <section class="auth-panel">
      <LanguageSwitcher />
      <div class="auth-card">
        <h2>{{ t('sign-up.title') }}</h2>
        <p>{{ t('sign-up.subtitle') }}</p>
        <Feedback :loading="iam.loading.value" :error="error || iam.error.value" />
        <form @submit.prevent="submit">
          <div class="form-grid">
            <label
              >{{ t('sign-up.first-name')
              }}<input v-model="form.firstName" required autocomplete="given-name" /></label
            ><label
              >{{ t('sign-up.last-name')
              }}<input v-model="form.lastName" required autocomplete="family-name"
            /></label>
          </div>
          <label
            >{{ t('sign-up.company-name')
            }}<input v-model="form.companyName" required autocomplete="organization" /></label
          ><label
            >{{ t('sign-up.email')
            }}<input v-model="form.email" required type="email" autocomplete="email" /></label
          ><label
            >{{ t('sign-up.organization-type')
            }}<select :aria-label="t('sign-up.organization-type')" v-model="form.role">
              <option value="construction_company">{{ t('sign-up.construction-company') }}</option>
              <option value="rental_company">{{ t('sign-up.rental-company') }}</option>
            </select></label
          >
          <div class="form-grid">
            <label
              >{{ t('sign-up.password')
              }}<input
                v-model="form.password"
                required
                minlength="8"
                type="password"
                autocomplete="new-password" /></label
            ><label
              >{{ t('sign-up.confirm-password')
              }}<input
                v-model="form.confirm"
                required
                minlength="8"
                type="password"
                autocomplete="new-password"
            /></label>
          </div>
          <button :disabled="iam.loading.value">{{ t('sign-up.create-account') }}</button>
        </form>
        <p>
          {{ t('sign-up.already-account') }}
          <RouterLink to="/iam/sign-in">{{ t('sign-up.sign-in') }}</RouterLink>
        </p>
      </div>
    </section>
  </main>
</template>

