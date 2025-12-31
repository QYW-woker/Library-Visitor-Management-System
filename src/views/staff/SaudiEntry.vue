<template>
  <div class="saudi-entry">
    <!-- Header -->
    <header class="page-header">
      <button class="back-btn" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip-rtl">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h1 class="page-title">{{ t('staff.saudi.title') }}</h1>
      <div class="header-spacer"></div>
    </header>

    <!-- Mode Banner -->
    <div class="mode-banner">
      <div class="mode-banner__icon">⚡</div>
      <div class="mode-banner__text">
        <strong>{{ t('staff.saudi.quickMode.title') }}</strong>
        <span>{{ t('staff.saudi.quickMode.description') }}</span>
      </div>
    </div>

    <!-- Form -->
    <form class="entry-form" @submit.prevent="handleSubmit">
      <!-- Full Name -->
      <div class="form-field">
        <label class="form-label">
          {{ t('staff.saudi.form.fullName.label') }}
          <span class="required">*</span>
        </label>
        <input
          ref="nameInputRef"
          v-model="form.fullName"
          type="text"
          class="form-input"
          :class="{ 'form-input--error': errors.fullName }"
          :placeholder="t('staff.saudi.form.fullName.placeholder')"
          autocomplete="off"
          enterkeyhint="next"
          @keyup.enter="focusMobile"
        />
        <span v-if="errors.fullName" class="form-error">{{ errors.fullName }}</span>
      </div>

      <!-- Mobile Number -->
      <div class="form-field">
        <label class="form-label">
          {{ t('staff.saudi.form.mobileNumber.label') }}
          <span class="required">*</span>
        </label>
        <div class="phone-input" :class="{ 'phone-input--error': errors.mobileNumber }">
          <span class="phone-prefix">+966</span>
          <input
            ref="mobileInputRef"
            v-model="form.mobileNumber"
            type="tel"
            class="phone-input__field"
            :placeholder="t('staff.saudi.form.mobileNumber.placeholder')"
            maxlength="12"
            autocomplete="off"
            enterkeyhint="done"
            @input="formatMobile"
            @keyup.enter="handleSubmit"
          />
        </div>
        <span v-if="errors.mobileNumber" class="form-error">{{ errors.mobileNumber }}</span>
      </div>

      <!-- Optional: Scan ID -->
      <button type="button" class="scan-option" @click="showScanHint">
        <span class="scan-option__icon">📷</span>
        <span class="scan-option__text">
          {{ t('staff.saudi.button.scanId') }}
          <small>({{ t('common.optional') }})</small>
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="scan-option__arrow flip-rtl">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </form>

    <!-- Submit Footer -->
    <footer class="submit-footer">
      <button
        class="submit-btn"
        :class="{ 'submit-btn--loading': isSubmitting }"
        :disabled="!isFormValid || isSubmitting"
        @click="handleSubmit"
      >
        <LoadingSpinner v-if="isSubmitting" size="small" />
        <template v-else>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{{ t('staff.saudi.button.submit') }}</span>
        </template>
      </button>
    </footer>

    <!-- Toast -->
    <AppToast
      :show="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useVisitorStore } from '@/stores/visitor'
import { validateSaudiMobile, validateName, formatMobileStorage } from '@/utils/validators'
import { VisitorType } from '@/types/visitor'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import AppToast from '@/components/AppToast.vue'

const router = useRouter()
const { t } = useI18n()
const visitorStore = useVisitorStore()

// Refs
const nameInputRef = ref(null)
const mobileInputRef = ref(null)

// Form state
const form = ref({
  fullName: '',
  mobileNumber: ''
})

const errors = ref({
  fullName: '',
  mobileNumber: ''
})

const isSubmitting = ref(false)

// Toast state
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('info')

// Form validation
const isFormValid = computed(() => {
  const name = form.value.fullName.trim()
  const mobile = form.value.mobileNumber.replace(/\s/g, '')
  return name.length >= 2 && mobile.length >= 9
})

// Auto focus on mount
onMounted(() => {
  nextTick(() => {
    nameInputRef.value?.focus()
  })
})

function goBack() {
  router.back()
}

function focusMobile() {
  mobileInputRef.value?.focus()
}

// Format mobile number: 5XX XXX XXXX
function formatMobile(e) {
  let value = e.target.value.replace(/\D/g, '')

  if (value.length > 9) {
    value = value.slice(0, 9)
  }

  if (value.length > 6) {
    value = `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5)}`
  } else if (value.length > 2) {
    value = `${value.slice(0, 2)} ${value.slice(2)}`
  }

  form.value.mobileNumber = value
}

function validateForm() {
  errors.value = { fullName: '', mobileNumber: '' }
  let valid = true

  if (!validateName(form.value.fullName)) {
    errors.value.fullName = t('validation.invalidName')
    valid = false
  }

  const mobile = form.value.mobileNumber.replace(/\s/g, '')
  if (!validateSaudiMobile(mobile)) {
    errors.value.mobileNumber = t('validation.invalidMobile')
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm() || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const mobile = form.value.mobileNumber.replace(/\s/g, '')
    const visitor = visitorStore.createVisitor({
      visitorType: VisitorType.SAUDI,
      fullName: form.value.fullName.trim(),
      mobileNumber: formatMobileStorage(mobile)
    })

    router.push(`/success/${visitor.id}`)
  } catch (error) {
    console.error('Failed to create visitor:', error)
    toastMessage.value = t('common.error')
    toastType.value = 'error'
    showToast.value = true
  } finally {
    isSubmitting.value = false
  }
}

function showScanHint() {
  toastMessage.value = 'ID scanning feature coming soon'
  toastType.value = 'info'
  showToast.value = true
}
</script>

<style lang="scss" scoped>
.saudi-entry {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

// Header
.page-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: $color-text-primary;

  &:active {
    background: #f5f5f5;
  }
}

.page-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  margin: 0;
}

.header-spacer {
  width: 40px;
}

// Mode Banner
.mode-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  border-radius: 12px;
  border-inline-start: 4px solid #4caf50;

  &__icon {
    font-size: 24px;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong {
      font-size: 15px;
      color: #2e7d32;
    }

    span {
      font-size: 13px;
      color: #558b2f;
    }
  }
}

// Form
.entry-form {
  flex: 1;
  padding: 8px 16px 120px;
}

.form-field {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: $color-text-primary;
  margin-bottom: 8px;

  .required {
    color: $color-error;
    margin-inline-start: 2px;
  }
}

.form-input {
  width: 100%;
  height: 52px;
  padding: 0 16px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fafafa;
  transition: border-color 0.2s, background 0.2s;

  &:focus {
    border-color: $color-primary;
    background: #ffffff;
  }

  &--error {
    border-color: $color-error;
    background: #fff8f8;
  }
}

.form-error {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: $color-error;
}

// Phone Input
.phone-input {
  display: flex;
  align-items: center;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fafafa;
  overflow: hidden;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: $color-primary;
    background: #ffffff;
  }

  &--error {
    border-color: $color-error;
    background: #fff8f8;
  }

  &__field {
    flex: 1;
    height: 52px;
    padding: 0 16px;
    font-size: 16px;
    border: none;
    background: transparent;
    direction: ltr;
    text-align: left;

    [dir="rtl"] & {
      text-align: right;
    }
  }
}

.phone-prefix {
  padding: 0 12px;
  font-size: 16px;
  font-weight: 500;
  color: $color-text-secondary;
  background: #f0f0f0;
  height: 52px;
  display: flex;
  align-items: center;
  border-inline-end: 1px solid #e0e0e0;
}

// Scan Option
.scan-option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: border-color 0.2s;
  margin-top: 24px;

  &:active {
    border-color: $color-primary;
    background: #f5f5f5;
  }

  &__icon {
    font-size: 24px;
    margin-inline-end: 12px;
  }

  &__text {
    flex: 1;
    text-align: start;
    font-size: 15px;
    color: $color-text-secondary;

    small {
      display: block;
      font-size: 12px;
      color: #bdbdbd;
      margin-top: 2px;
    }
  }

  &__arrow {
    color: #bdbdbd;
  }
}

// Submit Footer
.submit-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

.submit-btn {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 14px;
  background: linear-gradient(135deg, #006C35 0%, #00843D 100%);
  color: white;
  font-size: 17px;
  font-weight: 600;
  transition: opacity 0.2s, transform 0.15s;

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// RTL
.flip-rtl {
  [dir="rtl"] & {
    transform: scaleX(-1);
  }
}
</style>
