<template>
  <div class="chinese-entry">
    <!-- Header -->
    <header class="page-header">
      <button class="back-btn" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip-rtl">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h1 class="page-title">{{ t('staff.chinese.title') }}</h1>
      <div class="header-spacer"></div>
    </header>

    <!-- Step 1: Photo Capture -->
    <template v-if="currentStep === 'scan'">
      <div class="scan-section">
        <div class="camera-container">
          <div v-if="!capturedImage" class="camera-preview">
            <video ref="videoRef" autoplay playsinline class="camera-video"></video>
            <div class="camera-overlay">
              <div class="id-frame">
                <span class="id-frame__label">🪪 {{ t('staff.chinese.scan.idCard') }}</span>
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

        <button class="manual-entry-link" @click="skipToManual">
          {{ t('staff.foreign.ocr.manualEntry') }}
        </button>

        <input ref="fileInputRef" type="file" accept="image/*" class="hidden-input" @change="handleFileSelect" />
      </div>
    </template>

    <!-- Processing -->
    <template v-if="currentStep === 'processing'">
      <div class="processing-section">
        <LoadingSpinner size="large" />
        <p class="processing-text">{{ t('staff.chinese.ocr.processing') }}</p>
      </div>
    </template>

    <!-- Step 2: Form -->
    <template v-if="currentStep === 'form'">
      <div class="form-section">
        <!-- OCR Status -->
        <div v-if="ocrResult" class="ocr-status" :class="ocrResult.success ? 'ocr-status--success' : 'ocr-status--failed'">
          <span class="ocr-status__icon">{{ ocrResult.success ? '✓' : '⚠' }}</span>
          <span class="ocr-status__text">
            {{ ocrResult.success ? t('staff.chinese.ocr.success') : t('staff.chinese.ocr.failed') }}
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
              {{ t('staff.chinese.form.fullName.label') }}
              <span class="required">*</span>
            </label>
            <input
              v-model="form.fullName"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': errors.fullName }"
              :placeholder="t('staff.chinese.form.fullName.placeholder')"
            />
            <span v-if="errors.fullName" class="form-error">{{ errors.fullName }}</span>
          </div>

          <!-- ID Number -->
          <div class="form-field">
            <label class="form-label">
              {{ t('staff.chinese.form.idNumber.label') }}
              <span class="required">*</span>
            </label>
            <input
              v-model="form.idNumber"
              type="text"
              class="form-input form-input--mono"
              :class="{ 'form-input--error': errors.idNumber, 'form-input--warning': idNeedsCorrection }"
              :placeholder="t('staff.chinese.form.idNumber.placeholder')"
              maxlength="18"
              @input="form.idNumber = form.idNumber.toUpperCase()"
            />
            <span v-if="errors.idNumber" class="form-error">{{ errors.idNumber }}</span>
            <span v-else-if="idNeedsCorrection" class="form-warning">{{ t('staff.chinese.validation.idIncomplete') }}</span>
          </div>

          <!-- Gender & Ethnicity -->
          <div class="form-row">
            <div class="form-field form-field--half">
              <label class="form-label">{{ t('staff.chinese.form.gender.label') }}</label>
              <select v-model="form.gender" class="form-input form-select">
                <option value="">-</option>
                <option value="MALE">{{ t('staff.foreign.form.gender.male') }}</option>
                <option value="FEMALE">{{ t('staff.foreign.form.gender.female') }}</option>
              </select>
            </div>
            <div class="form-field form-field--half">
              <label class="form-label">{{ t('staff.chinese.form.ethnicity.label') }}</label>
              <input
                v-model="form.ethnicity"
                type="text"
                class="form-input"
                :placeholder="t('staff.chinese.form.ethnicity.placeholder')"
              />
            </div>
          </div>

          <!-- Date of Birth -->
          <div class="form-field">
            <label class="form-label">{{ t('staff.chinese.form.dateOfBirth.label') }}</label>
            <input v-model="form.dateOfBirth" type="date" class="form-input" />
          </div>

          <!-- Address -->
          <div class="form-field">
            <label class="form-label">{{ t('staff.chinese.form.address.label') }}</label>
            <input
              v-model="form.address"
              type="text"
              class="form-input"
              :placeholder="t('staff.chinese.form.address.placeholder')"
            />
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
            <span>{{ t('staff.chinese.button.submit') }}</span>
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
import { validateName } from '@/utils/validators'
import { VisitorType } from '@/types/visitor'
import { recognizeChineseId, isOcrConfigured } from '@/services/ocrService'
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
  idNumber: '',
  gender: '',
  ethnicity: '',
  dateOfBirth: '',
  address: '',
  mobileNumber: ''
})

const errors = ref({
  fullName: '',
  idNumber: ''
})

const isSubmitting = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('info')

// Form validation - allow 15-18 digit IDs (OCR may miss some digits)
const isFormValid = computed(() => {
  return (
    form.value.fullName.trim().length >= 2 &&
    validateChineseIdBasic(form.value.idNumber)
  )
})

// Basic validation - accept 15-18 digit IDs for form submission
function validateChineseIdBasic(id) {
  if (!id) return false
  // Accept 15-18 digit IDs (OCR may occasionally miss digits)
  const basicRegex = /^[1-9]\d{14,17}[\dXx]?$/
  return basicRegex.test(id)
}

// Strict validation - exactly 18 digits in standard format
function validateChineseIdStrict(id) {
  if (!id) return false
  // Chinese ID: 18 characters, last can be digit or X
  const regex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
  return regex.test(id)
}

// Check if ID needs manual correction
const idNeedsCorrection = computed(() => {
  const id = form.value.idNumber
  return id && validateChineseIdBasic(id) && !validateChineseIdStrict(id)
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

async function processId() {
  if (!capturedImage.value) return

  currentStep.value = 'processing'

  try {
    // 调用扣子工作流API进行OCR识别
    const result = await recognizeChineseId(capturedImage.value)

    ocrResult.value = result

    // Fill form with OCR data
    if (result.success && result.fields) {
      form.value.fullName = result.fields.fullName || ''
      form.value.idNumber = result.fields.idNumber || ''
      form.value.gender = result.fields.gender || ''
      form.value.ethnicity = result.fields.ethnicity || ''
      form.value.dateOfBirth = result.fields.dateOfBirth || ''
      form.value.address = result.fields.address || ''

      // 如果是Mock数据（API未配置），显示提示
      if (result.isMock) {
        toastMessage.value = 'OCR服务未配置，请手动输入信息'
        toastType.value = 'warning'
        showToast.value = true
      }
    } else {
      // OCR失败，显示错误提示
      toastMessage.value = result.error || t('staff.chinese.ocr.failed')
      toastType.value = 'error'
      showToast.value = true
    }
  } catch (error) {
    console.error('OCR processing error:', error)
    ocrResult.value = { success: false, error: error.message }
    toastMessage.value = t('staff.chinese.ocr.failed')
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
  errors.value = { fullName: '', idNumber: '' }
  let valid = true

  if (!validateName(form.value.fullName)) {
    errors.value.fullName = t('validation.invalidName')
    valid = false
  }

  if (!validateChineseIdBasic(form.value.idNumber)) {
    errors.value.idNumber = t('staff.chinese.validation.invalidId')
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm() || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const visitor = visitorStore.createVisitor({
      visitorType: VisitorType.CHINESE,
      fullName: form.value.fullName.trim(),
      chineseIdNumber: form.value.idNumber.trim().toUpperCase(),
      chineseIdImage: capturedImage.value || undefined,
      gender: form.value.gender || undefined,
      ethnicity: form.value.ethnicity || undefined,
      dateOfBirth: form.value.dateOfBirth || undefined,
      address: form.value.address || undefined,
      mobileNumber: form.value.mobileNumber || undefined,
      nationality: 'CN',
      nationalityName: t('nationality.CN'),
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
.chinese-entry {
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
  padding-bottom: 24px;
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
  border: 3px dashed rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;

  &__label {
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 14px;
  }
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

.scan-btn {
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
    background: linear-gradient(135deg, #DE2910 0%, #EE1C25 100%);
    color: white;
  }

  &--secondary {
    background: #f5f5f5;
    color: $color-text-primary;
  }

  &__icon {
    font-size: 18px;
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
    border-color: #DE2910;
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

.form-warning {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #e67e00;
}

.form-input--warning {
  border-color: #e67e00;
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
  background: linear-gradient(135deg, #DE2910 0%, #EE1C25 100%);
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
