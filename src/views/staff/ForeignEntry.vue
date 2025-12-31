<template>
  <div class="foreign-entry">
    <!-- Header -->
    <header class="page-header">
      <button class="back-btn" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip-rtl">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h1 class="page-title">{{ t('staff.foreign.title') }}</h1>
      <div class="header-spacer"></div>
    </header>

    <!-- Step 1: Photo Capture -->
    <template v-if="currentStep === 'scan'">
      <div class="scan-section">
        <div class="camera-container">
          <div v-if="!capturedImage" class="camera-preview">
            <video ref="videoRef" autoplay playsinline class="camera-video"></video>
            <div class="camera-frame">
              <div class="frame-corner frame-corner--tl"></div>
              <div class="frame-corner frame-corner--tr"></div>
              <div class="frame-corner frame-corner--bl"></div>
              <div class="frame-corner frame-corner--br"></div>
            </div>
            <p class="camera-hint">{{ t('staff.foreign.scan.instruction') }}</p>
          </div>
          <div v-else class="captured-preview">
            <img :src="capturedImage" alt="Captured passport" />
          </div>
        </div>

        <div class="scan-actions">
          <template v-if="!capturedImage">
            <button class="action-btn action-btn--primary" @click="takePhoto">
              <span>📷</span>
              <span>{{ t('staff.foreign.scan.takePhoto') }}</span>
            </button>
            <button class="action-btn action-btn--secondary" @click="uploadImage">
              <span>📁</span>
              <span>{{ t('staff.foreign.scan.uploadImage') }}</span>
            </button>
          </template>
          <template v-else>
            <button class="action-btn action-btn--secondary" @click="retakePhoto">
              <span>🔄</span>
              <span>{{ t('staff.foreign.scan.retake') }}</span>
            </button>
            <button class="action-btn action-btn--primary" @click="processPassport">
              <span>✓</span>
              <span>{{ t('staff.foreign.scan.usePhoto') }}</span>
            </button>
          </template>
        </div>

        <button class="manual-entry-link" @click="skipToManual">
          {{ t('staff.foreign.ocr.manualEntry') }}
        </button>

        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden-input"
          @change="handleFileSelect"
        />
      </div>
    </template>

    <!-- Processing -->
    <template v-if="currentStep === 'processing'">
      <div class="processing-section">
        <LoadingSpinner size="large" />
        <p class="processing-text">{{ t('staff.foreign.ocr.processing') }}</p>
      </div>
    </template>

    <!-- Step 2: Form -->
    <template v-if="currentStep === 'form'">
      <div class="form-section">
        <!-- OCR Status -->
        <div v-if="ocrResult" class="ocr-status" :class="ocrResult.success ? 'ocr-status--success' : 'ocr-status--failed'">
          <span class="ocr-status__icon">{{ ocrResult.success ? '✓' : '⚠' }}</span>
          <span class="ocr-status__text">
            {{ ocrResult.success ? t('staff.foreign.ocr.success') : t('staff.foreign.ocr.failed') }}
          </span>
          <span v-if="ocrResult.success" class="ocr-status__confidence">
            {{ t('staff.foreign.ocr.confidence') }}: {{ ocrResult.confidence }}%
          </span>
        </div>

        <!-- Form -->
        <form class="entry-form" @submit.prevent="handleSubmit">
          <!-- Full Name -->
          <div class="form-field">
            <label class="form-label">
              {{ t('staff.foreign.form.fullName.label') }}
              <span class="required">*</span>
            </label>
            <input
              v-model="form.fullName"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': errors.fullName }"
              :placeholder="t('staff.foreign.form.fullName.placeholder')"
            />
            <span v-if="errors.fullName" class="form-error">{{ errors.fullName }}</span>
          </div>

          <!-- Passport Number -->
          <div class="form-field">
            <label class="form-label">
              {{ t('staff.foreign.form.passportNumber.label') }}
              <span class="required">*</span>
            </label>
            <input
              v-model="form.passportNumber"
              type="text"
              class="form-input form-input--mono"
              :class="{ 'form-input--error': errors.passportNumber }"
              :placeholder="t('staff.foreign.form.passportNumber.placeholder')"
              @input="form.passportNumber = form.passportNumber.toUpperCase()"
            />
            <span v-if="errors.passportNumber" class="form-error">{{ errors.passportNumber }}</span>
          </div>

          <!-- Nationality -->
          <div class="form-field">
            <label class="form-label">
              {{ t('staff.foreign.form.nationality.label') }}
              <span class="required">*</span>
            </label>
            <select
              v-model="form.nationality"
              class="form-input form-select"
              :class="{ 'form-input--error': errors.nationality }"
            >
              <option value="" disabled>{{ t('staff.foreign.form.nationality.placeholder') }}</option>
              <option v-for="country in countries" :key="country.code" :value="country.code">
                {{ country.flag }} {{ country.name }}
              </option>
            </select>
            <span v-if="errors.nationality" class="form-error">{{ errors.nationality }}</span>
          </div>

          <!-- Date of Birth & Gender -->
          <div class="form-row">
            <div class="form-field form-field--half">
              <label class="form-label">{{ t('staff.foreign.form.dateOfBirth.label') }}</label>
              <input v-model="form.dateOfBirth" type="date" class="form-input" />
            </div>
            <div class="form-field form-field--half">
              <label class="form-label">{{ t('staff.foreign.form.gender.label') }}</label>
              <select v-model="form.gender" class="form-input form-select">
                <option value="">-</option>
                <option value="MALE">{{ t('staff.foreign.form.gender.male') }}</option>
                <option value="FEMALE">{{ t('staff.foreign.form.gender.female') }}</option>
              </select>
            </div>
          </div>

          <!-- Passport Expiry -->
          <div class="form-field">
            <label class="form-label">{{ t('staff.foreign.form.passportExpiry.label') }}</label>
            <input v-model="form.passportExpiry" type="date" class="form-input" />
          </div>

          <!-- Mobile (Optional) -->
          <div class="form-field">
            <label class="form-label">
              {{ t('staff.foreign.form.mobileNumber.label') }}
              <span class="optional">({{ t('common.optional') }})</span>
            </label>
            <input
              v-model="form.mobileNumber"
              type="tel"
              class="form-input"
              :placeholder="t('staff.foreign.form.mobileNumber.placeholder')"
            />
          </div>
        </form>
      </div>

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
            <span>{{ t('staff.foreign.button.submit') }}</span>
          </template>
        </button>
      </footer>
    </template>

    <AppToast :show="showToast" :message="toastMessage" :type="toastType" @close="showToast = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useVisitorStore } from '@/stores/visitor'
import { validateName, validatePassport } from '@/utils/validators'
import { VisitorType, COUNTRIES } from '@/types/visitor'
import { recognizePassport } from '@/services/ocrService'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import AppToast from '@/components/AppToast.vue'

const router = useRouter()
const { t } = useI18n()
const visitorStore = useVisitorStore()

// Refs
const videoRef = ref(null)
const fileInputRef = ref(null)

// Step state
const currentStep = ref('scan') // 'scan' | 'processing' | 'form'

// Camera
const mediaStream = ref(null)
const capturedImage = ref(null)

// OCR
const ocrResult = ref(null)

// Form
const form = ref({
  fullName: '',
  passportNumber: '',
  nationality: '',
  dateOfBirth: '',
  gender: '',
  passportExpiry: '',
  mobileNumber: ''
})

const errors = ref({
  fullName: '',
  passportNumber: '',
  nationality: ''
})

const isSubmitting = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('info')

// Countries list
const countries = computed(() => {
  return COUNTRIES.map(c => ({
    code: c.code,
    flag: c.flag,
    name: t(`nationality.${c.code}`)
  }))
})

// Form validation
const isFormValid = computed(() => {
  return (
    form.value.fullName.trim().length >= 2 &&
    form.value.passportNumber.trim().length >= 6 &&
    form.value.nationality
  )
})

onMounted(async () => {
  await initCamera()
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
    // Go to manual entry if camera fails
    skipToManual()
  }
}

function stopCamera() {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
}

function goBack() {
  if (currentStep.value === 'form') {
    currentStep.value = 'scan'
    capturedImage.value = null
    ocrResult.value = null
    initCamera()
  } else {
    router.back()
  }
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
  initCamera()
}

async function processPassport() {
  if (!capturedImage.value) return

  currentStep.value = 'processing'

  try {
    console.log('Processing Passport with OCR...')

    // 调用护照OCR服务
    const result = await recognizePassport(capturedImage.value)
    console.log('Passport OCR result:', result)

    ocrResult.value = result

    // Fill form with OCR data
    if (result.success && result.fields) {
      form.value.fullName = result.fields.fullName || ''
      form.value.passportNumber = result.fields.passportNumber || ''
      form.value.nationality = result.fields.nationality || ''
      form.value.dateOfBirth = result.fields.dateOfBirth || ''
      form.value.gender = result.fields.gender || ''
      form.value.passportExpiry = result.fields.passportExpiry || ''

      // 如果是mock数据，显示提示
      if (result.isMock) {
        toastMessage.value = t('staff.foreign.ocr.manualEntry')
        toastType.value = 'info'
        showToast.value = true
      }
    } else {
      // OCR失败，显示错误信息
      toastMessage.value = t('staff.foreign.ocr.failed')
      toastType.value = 'error'
      showToast.value = true
    }
  } catch (error) {
    console.error('Passport OCR processing error:', error)
    ocrResult.value = {
      success: false,
      error: error.message,
      fields: {}
    }
    toastMessage.value = t('staff.foreign.ocr.failed')
    toastType.value = 'error'
    showToast.value = true
  }

  currentStep.value = 'form'
}

function skipToManual() {
  stopCamera()
  capturedImage.value = null
  ocrResult.value = null
  currentStep.value = 'form'
}

function validateForm() {
  errors.value = { fullName: '', passportNumber: '', nationality: '' }
  let valid = true

  if (!validateName(form.value.fullName)) {
    errors.value.fullName = t('validation.invalidName')
    valid = false
  }

  if (!validatePassport(form.value.passportNumber)) {
    errors.value.passportNumber = t('validation.invalidPassport')
    valid = false
  }

  if (!form.value.nationality) {
    errors.value.nationality = t('validation.required')
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm() || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const nationalityName = countries.value.find(c => c.code === form.value.nationality)?.name || ''

    const visitor = visitorStore.createVisitor({
      visitorType: VisitorType.FOREIGN,
      fullName: form.value.fullName.trim(),
      passportNumber: form.value.passportNumber.trim().toUpperCase(),
      nationality: form.value.nationality,
      nationalityName,
      dateOfBirth: form.value.dateOfBirth || undefined,
      gender: form.value.gender || undefined,
      passportExpiry: form.value.passportExpiry || undefined,
      mobileNumber: form.value.mobileNumber || undefined,
      passportImageUrl: capturedImage.value || undefined,
      ocrUsed: !!ocrResult.value?.success,
      ocrConfidence: ocrResult.value?.confidence,
      ocrRawData: ocrResult.value
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
.foreign-entry {
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

// Scan Section
.scan-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.camera-container {
  flex: 1;
  min-height: 300px;
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

.camera-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 85%;
  height: 55%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.frame-corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #ffffff;
  border-style: solid;

  &--tl { top: -2px; left: -2px; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
  &--tr { top: -2px; right: -2px; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
  &--bl { bottom: -2px; left: -2px; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
  &--br { bottom: -2px; right: -2px; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }
}

.camera-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 14px;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  white-space: nowrap;
}

.captured-preview {
  width: 100%;
  height: 100%;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.scan-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 52px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;

  &--primary {
    background: linear-gradient(135deg, #1976D2 0%, #2196F3 100%);
    color: white;
  }

  &--secondary {
    background: #f5f5f5;
    color: $color-text-primary;
  }
}

.manual-entry-link {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  color: $color-text-secondary;
  font-size: 14px;
  text-decoration: underline;
  text-align: center;
}

.hidden-input {
  display: none;
}

// Processing
.processing-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.processing-text {
  font-size: 16px;
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

  &--success {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &--failed {
    background: #fff3e0;
    color: #e65100;
  }

  &__icon { font-size: 18px; }
  &__text { flex: 1; font-weight: 500; }
  &__confidence { font-size: 13px; opacity: 0.8; }
}

// Form Section
.form-section {
  flex: 1;
  padding-bottom: 100px;
}

.entry-form {
  padding: 8px 16px;
}

.form-field {
  margin-bottom: 16px;

  &--half {
    flex: 1;
  }
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: $color-text-primary;
  margin-bottom: 8px;

  .required { color: $color-error; }
  .optional { color: #9e9e9e; font-weight: 400; }
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: #fafafa;

  &:focus {
    border-color: $color-secondary;
    background: #ffffff;
  }

  &--error {
    border-color: $color-error;
  }

  &--mono {
    font-family: $font-family-mono;
    letter-spacing: 1px;
  }
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: calc(100% - 14px) center;
  padding-inline-end: 40px;
}

.form-error {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: $color-error;
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
}

.submit-btn {
  width: 100%;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1976D2 0%, #2196F3 100%);
  color: white;
  font-size: 17px;
  font-weight: 600;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.flip-rtl {
  [dir="rtl"] & {
    transform: scaleX(-1);
  }
}
</style>
