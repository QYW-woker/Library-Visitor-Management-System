<template>
  <div class="success-page">
    <!-- Success Animation -->
    <div class="success-animation">
      <div class="success-circle">
        <svg class="success-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>

    <!-- Success Message -->
    <h1 class="success-title">{{ t('staff.success.title') }}</h1>
    <p class="success-message">{{ t('staff.success.message') }}</p>

    <!-- Visitor Card -->
    <div v-if="visitor" class="visitor-card">
      <div class="visitor-card__row">
        <span class="visitor-card__icon">👤</span>
        <span class="visitor-card__label">{{ t('staff.success.visitorName') }}</span>
        <span class="visitor-card__value">{{ visitor.fullName }}</span>
      </div>
      <div class="visitor-card__row">
        <span class="visitor-card__icon">🕐</span>
        <span class="visitor-card__label">{{ t('staff.success.entryTime') }}</span>
        <span class="visitor-card__value visitor-card__value--mono">{{ visitor.entryTime }}</span>
      </div>
      <div v-if="visitor.visitorType === 'FOREIGN'" class="visitor-card__row">
        <span class="visitor-card__icon">🌍</span>
        <span class="visitor-card__label">{{ t('admin.visitors.table.nationality') }}</span>
        <span class="visitor-card__value">{{ visitor.nationalityName }}</span>
      </div>
    </div>

    <!-- Countdown -->
    <p class="countdown-text">
      {{ t('staff.success.autoRedirect', { seconds: countdown }) }}
    </p>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button class="btn btn--primary" @click="nextVisitor">
        <span>{{ t('staff.success.nextVisitor') }}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip-rtl">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      <button class="btn btn--text" @click="backHome">
        {{ t('staff.success.backHome') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useVisitorStore } from '@/stores/visitor'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const visitorStore = useVisitorStore()

const visitor = ref(null)
const countdown = ref(3)
let countdownTimer = null

onMounted(() => {
  const id = route.params.id
  visitor.value = visitorStore.getVisitor(id)

  // Start countdown
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      router.push('/')
    }
  }, 1000)
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})

function nextVisitor() {
  clearInterval(countdownTimer)
  if (visitor.value?.visitorType === 'SAUDI') {
    router.push('/saudi')
  } else {
    router.push('/foreign')
  }
}

function backHome() {
  clearInterval(countdownTimer)
  router.push('/')
}
</script>

<style lang="scss" scoped>
.success-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(180deg, #e8f5e9 0%, #ffffff 50%);
}

// Success Animation
.success-animation {
  margin-bottom: 24px;
}

.success-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 32px rgba(76, 175, 80, 0.3);
}

.success-icon {
  color: white;
  animation: check-in 0.3s ease-out 0.2s both;
}

@keyframes scale-in {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes check-in {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

// Text
.success-title {
  font-size: 24px;
  font-weight: 700;
  color: $color-text-primary;
  margin: 0 0 8px;
  text-align: center;
}

.success-message {
  font-size: 15px;
  color: $color-text-secondary;
  margin: 0 0 24px;
  text-align: center;
}

// Visitor Card
.visitor-card {
  width: 100%;
  max-width: 320px;
  padding: 16px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;

  &__row {
    display: flex;
    align-items: center;
    padding: 12px 0;

    &:not(:last-child) {
      border-bottom: 1px solid #f0f0f0;
    }
  }

  &__icon {
    font-size: 20px;
    margin-inline-end: 12px;
  }

  &__label {
    flex: 1;
    font-size: 14px;
    color: $color-text-secondary;
  }

  &__value {
    font-size: 15px;
    font-weight: 600;
    color: $color-text-primary;

    &--mono {
      font-family: $font-family-mono;
    }
  }
}

// Countdown
.countdown-text {
  font-size: 14px;
  color: $color-text-tertiary;
  margin: 0 0 32px;
}

// Buttons
.action-buttons {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  height: 52px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &--primary {
    background: linear-gradient(135deg, #006C35 0%, #00843D 100%);
    color: white;
    box-shadow: 0 4px 16px rgba(0, 108, 53, 0.3);
  }

  &--text {
    background: transparent;
    color: $color-text-secondary;
  }
}

.flip-rtl {
  [dir="rtl"] & {
    transform: scaleX(-1);
  }
}
</style>
