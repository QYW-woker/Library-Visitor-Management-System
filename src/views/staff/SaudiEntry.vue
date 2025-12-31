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

    <!-- Mode Tabs -->
    <div class="mode-tabs">
      <button
        class="mode-tab"
        :class="{ 'mode-tab--active': mode === 'quick' }"
        @click="mode = 'quick'"
      >
        ⚡ {{ t('staff.saudi.quickMode.title') }}
      </button>
      <button
        class="mode-tab"
        :class="{ 'mode-tab--active': mode === 'scan' }"
        @click="mode = 'scan'"
      >
        📷 {{ t('staff.saudi.button.scanId') }}
      </button>
    </div>

    <!-- Quick Mode: Form Only -->
    <template v-if="mode === 'quick'">
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
      </form>
    </template>

    <!-- Scan Mode: Camera + OCR -->
    <template v-if="mode === 'scan'">
      <!-- Camera/Upload Section -->
      <div v-if="!ocrCompleted" class="scan-section">
        <div class="camera-container">
          <div v-if="!capturedImage" class="camera-preview">
            <video ref="videoRef" autoplay playsinline class="camera-video"></video>
            <div class="camera-overlay">
              <div class="id-frame">
                <span class="id-frame__label">🪪 National ID</span>
              </div>
            </div>
          </div>
          <div v-else class="captured-preview">
            <img :src="capturedImage" alt="Captured ID" />
          </div>
        </div>

        <div class="scan-actions">
          <template v-if="!capturedImage">
            <button class="scan-btn scan-btn--primary" @click="takePhoto">
              <span class="scan-btn__icon">📷</span>
              <span>{{ t('staff.foreign.scan.takePhoto') }}</span>
            </button>
            <button class="scan-btn scan-btn--secondary" @click="uploadImage">
              <span class="scan-btn__icon">📁</span>
              <span>{{ t('staff.foreign.scan.uploadImage') }}</span>
            </button>
          </template>
          <template v-else>
            <button class="scan-btn scan-btn--secondary" @click="retakePhoto">
              🔄 {{ t('staff.foreign.scan.retake') }}
            </button>
            <button class="scan-btn scan-btn--primary" @click="processId">
              ✓ {{ t('staff.foreign.scan.usePhoto') }}
            </button>
          </template>
        </div>

        <input ref="fileInputRef" type="file" accept="image/*" capture="environment" class="hidden-input" @change="handleFileSelect" />
      </div>

      <!-- OCR Processing -->
      <div v-if="isProcessing" class="processing-section">
        <LoadingSpinner size="large" />
        <p>{{ t('staff.foreign.ocr.processing') }}</p>
      </div>

      <!-- OCR Result Form -->
      <div v-if="ocrCompleted && !isProcessing" class="form-section">
        <div class="ocr-status" :class="ocrResult?.success ? 'ocr-status--success' : 'ocr-status--failed'">
          <span>{{ ocrResult?.success ? '✓' : '⚠' }}</span>
          <span>{{ ocrResult?.success ? t('staff.foreign.ocr.success') : t('staff.foreign.ocr.failed') }}</span>
        </div>

        <form class="entry-form" @submit.prevent="handleSubmit">
          <div class="form-field">
            <label class="form-label">{{ t('staff.saudi.form.fullName.label') }} <span class="required">*</span></label>
            <input v-model="form.fullName" type="text" class="form-input" :class="{ 'form-input--error': errors.fullName }" />
            <span v-if="errors.fullName" class="form-error">{{ errors.fullName }}</span>
          </div>
          <div class="form-field">
            <label class="form-label">{{ t('staff.saudi.form.mobileNumber.label') }} <span class="required">*</span></label>
            <div class="phone-input">
              <span class="phone-prefix">+966</span>
              <input v-model="form.mobileNumber" type="tel" class="phone-input__field" @input="formatMobile" />
            </div>
            <span v-if="errors.mobileNumber" class="form-error">{{ errors.mobileNumber }}</span>
          </div>
          <div class="form-field">
            <label class="form-label">{{ t('staff.saudi.form.nationalId.label') }}</label>
            <input v-model="form.nationalId" type="text" class="form-input form-input--mono" maxlength="10" />
          </div>
        </form>
      </div>
    </template>

    <!-- Submit Footer -->
    <footer v-if="mode === 'quick' || ocrCompleted" class="submit-footer">
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

    <AppToast :show="showToast" :message="toastMessage" :type="toastType" @close="showToast = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
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

// Mode
const mode = ref('quick') // 'quick' | 'scan'

// Refs
const nameInputRef = ref(null)
const mobileInputRef = ref(null)
const videoRef = ref(null)
const fileInputRef = ref(null)

// Camera
const mediaStream = ref(null)
const capturedImage = ref(null)

// OCR
const isProcessing = ref(false)
const ocrCompleted = ref(false)
const ocrResult = ref(null)

// Form
const form = ref({
  fullName: '',
  mobileNumber: '',
  nationalId: ''
})

const errors = ref({
  fullName: '',
  mobileNumber: ''
})

const isSubmitting = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('info')

// Form validation
const isFormValid = computed(() => {
  const name = form.value.fullName.trim()
  const mobile = form.value.mobileNumber.replace(/\s/g, '')
  return name.length >= 2 && mobile.length >= 9
})

// Watch mode change
watch(mode, async (newMode) => {
  if (newMode === 'scan') {
    await nextTick()
    await initCamera()
  } else {
    stopCamera()
    capturedImage.value = null
    ocrCompleted.value = false
    ocrResult.value = null
  }
})

onMounted(() => {
  nextTick(() => {
    nameInputRef.value?.focus()
  })
})

onUnmounted(() => {
  stopCamera()
})

async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })
    mediaStream.value = stream
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (error) {
    console.error('Camera error:', error)
    toastMessage.value = 'Camera not available'
    toastType.value = 'error'
    showToast.value = true
  }
}

function stopCamera() {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
}

function goBack() {
  router.back()
}

function focusMobile() {
  mobileInputRef.value?.focus()
}

function formatMobile(e) {
  let value = e.target.value.replace(/\D/g, '')
  if (value.length > 9) value = value.slice(0, 9)
  if (value.length > 6) {
    value = `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5)}`
  } else if (value.length > 2) {
    value = `${value.slice(0, 2)} ${value.slice(2)}`
  }
  form.value.mobileNumber = value
}

function takePhoto() {
  if (!videoRef.value) return
  const canvas = document.createElement('canvas')
  canvas.width = videoRef.value.videoWidth
  canvas.height = videoRef.value.videoHeight
  const ctx = canvas.getContext('2d')
  ctx?.drawImage(videoRef.value, 0, 0)
  capturedImage.value = canvas.toDataURL('image/jpeg', 0.9)
  stopCamera()
}

function uploadImage() {
  fileInputRef.value?.click()
}

function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    capturedImage.value = e.target?.result
    stopCamera()
  }
  reader.readAsDataURL(file)
}

function retakePhoto() {
  capturedImage.value = null
  ocrCompleted.value = false
  initCamera()
}

async function processId() {
  isProcessing.value = true

  // Mock OCR - simulate processing
  await new Promise(resolve => setTimeout(resolve, 1200))

  // Mock result
  ocrResult.value = {
    success: true,
    fields: {
      fullName: 'محمد عبدالله الأحمد',
      nationalId: '1087654321'
    }
  }

  if (ocrResult.value.success) {
    form.value.fullName = ocrResult.value.fields.fullName || ''
    form.value.nationalId = ocrResult.value.fields.nationalId || ''
  }

  isProcessing.value = false
  ocrCompleted.value = true
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
      mobileNumber: formatMobileStorage(mobile),
      nationalId: form.value.nationalId || undefined,
      nationalIdScanned: mode.value === 'scan' && ocrCompleted.value
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
</script>

<style lang="scss" scoped>
.saudi-entry {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

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
  &:active { background: #f5f5f5; }
}

.page-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  margin: 0;
}

.header-spacer { width: 40px; }

// Mode Tabs
.mode-tabs {
  display: flex;
  margin: 16px;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 4px;
}

.mode-tab {
  flex: 1;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: $color-text-secondary;
  transition: all 0.2s;

  &--active {
    background: #ffffff;
    color: $color-primary;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
}

// Form
.entry-form {
  flex: 1;
  padding: 8px 16px 120px;
}

.form-field { margin-bottom: 20px; }

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  .required { color: $color-error; }
}

.form-input {
  width: 100%;
  height: 52px;
  padding: 0 16px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fafafa;
  &:focus { border-color: $color-primary; background: #fff; }
  &--error { border-color: $color-error; }
  &--mono { font-family: $font-family-mono; letter-spacing: 2px; }
}

.form-error {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: $color-error;
}

.phone-input {
  display: flex;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fafafa;
  overflow: hidden;
  &:focus-within { border-color: $color-primary; background: #fff; }
  &--error { border-color: $color-error; }
  &__field {
    flex: 1;
    height: 52px;
    padding: 0 16px;
    font-size: 16px;
    border: none;
    background: transparent;
    direction: ltr;
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

// Scan Section
.scan-section {
  flex: 1;
  padding: 16px;
  padding-bottom: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.camera-container {
  flex: 1;
  min-height: 200px;
  max-height: calc(100vh - 280px);
  border-radius: 16px;
  overflow: hidden;
  background: #1a1a1a;
  position: relative;
}

.camera-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.id-frame {
  width: 85%;
  height: 60%;
  border: 3px dashed rgba(255,255,255,0.6);
  border-radius: 12px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;

  &__label {
    background: rgba(0,0,0,0.6);
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 14px;
  }
}

.captured-preview {
  width: 100%;
  height: 100%;
  img { width: 100%; height: 100%; object-fit: contain; }
}

.scan-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.scan-btn {
  flex: 1;
  height: 52px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &--primary {
    background: linear-gradient(135deg, #006C35 0%, #00843D 100%);
    color: white;
  }
  &--secondary {
    background: #f5f5f5;
    color: $color-text-primary;
  }
  &__icon { font-size: 18px; }
}

.hidden-input { display: none; }

// Processing
.processing-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: $color-text-secondary;
}

// OCR Status
.ocr-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 500;

  &--success { background: #e8f5e9; color: #2e7d32; }
  &--failed { background: #fff3e0; color: #e65100; }
}

.form-section {
  flex: 1;
  padding-bottom: 100px;
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
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.flip-rtl {
  [dir="rtl"] & { transform: scaleX(-1); }
}
</style>
