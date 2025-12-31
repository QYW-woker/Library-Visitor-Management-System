<template>
  <div class="home-page">
    <!-- Brand Header -->
    <header class="brand-header">
      <div class="brand-logo">🏛</div>
      <h1 class="brand-title">{{ t('app.name') }}</h1>
      <p class="brand-subtitle">{{ t('app.library') }}</p>
    </header>

    <!-- Main Action Area -->
    <main class="action-area">
      <!-- Saudi National Button (Primary) -->
      <button class="action-btn action-btn--primary" @click="goToSaudi">
        <div class="action-btn__icon">🇸🇦</div>
        <div class="action-btn__content">
          <span class="action-btn__title">{{ t('staff.home.saudiButton.title') }}</span>
          <span class="action-btn__subtitle">{{ t('staff.home.saudiButton.subtitle') }}</span>
        </div>
        <div class="action-btn__arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip-rtl">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </button>

      <!-- Chinese Visitor Button -->
      <button class="action-btn action-btn--chinese" @click="goToChinese">
        <div class="action-btn__icon">🇨🇳</div>
        <div class="action-btn__content">
          <span class="action-btn__title">{{ t('staff.home.chineseButton.title') }}</span>
          <span class="action-btn__subtitle">{{ t('staff.home.chineseButton.subtitle') }}</span>
        </div>
        <div class="action-btn__arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip-rtl">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </button>

      <!-- Foreign Visitor Button (Secondary) -->
      <button class="action-btn action-btn--secondary" @click="goToForeign">
        <div class="action-btn__icon">🌍</div>
        <div class="action-btn__content">
          <span class="action-btn__title">{{ t('staff.home.foreignButton.title') }}</span>
          <span class="action-btn__subtitle">{{ t('staff.home.foreignButton.subtitle') }}</span>
        </div>
        <div class="action-btn__arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip-rtl">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </button>
    </main>

    <!-- Today's Stats -->
    <section class="stats-card">
      <h3 class="stats-card__title">📊 {{ t('staff.home.todayStats.title') }}</h3>
      <div class="stats-card__grid">
        <div class="stat-item">
          <span class="stat-item__icon">🇸🇦</span>
          <span class="stat-item__value">{{ stats.saudiVisitors }}</span>
          <span class="stat-item__label">{{ t('staff.home.todayStats.saudi') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-item__icon">🇨🇳</span>
          <span class="stat-item__value">{{ stats.chineseVisitors }}</span>
          <span class="stat-item__label">{{ t('staff.home.todayStats.chinese') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-item__icon">🌍</span>
          <span class="stat-item__value">{{ stats.foreignVisitors }}</span>
          <span class="stat-item__label">{{ t('staff.home.todayStats.foreign') }}</span>
        </div>
        <div class="stat-item stat-item--total">
          <span class="stat-item__value">{{ stats.totalVisitors }}</span>
          <span class="stat-item__label">{{ t('staff.home.todayStats.total') }}</span>
        </div>
      </div>
    </section>

    <!-- Language Switcher -->
    <footer class="language-footer">
      <LanguageSwitcher />
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useVisitorStore } from '@/stores/visitor'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const router = useRouter()
const { t } = useI18n()
const visitorStore = useVisitorStore()

const stats = computed(() => visitorStore.todayStats)

onMounted(() => {
  visitorStore.initDemoData()
})

function goToSaudi() {
  router.push('/saudi')
}

function goToChinese() {
  router.push('/chinese')
}

function goToForeign() {
  router.push('/foreign')
}
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  background: linear-gradient(180deg, #f8faf9 0%, #ffffff 100%);
}

// Brand Header
.brand-header {
  text-align: center;
  padding: 20px 0 32px;
}

.brand-logo {
  font-size: 48px;
  margin-bottom: 12px;
}

.brand-title {
  font-size: 20px;
  font-weight: 700;
  color: $color-text-primary;
  margin: 0 0 4px;
}

.brand-subtitle {
  font-size: 14px;
  color: $color-text-secondary;
  margin: 0;
}

// Action Area
.action-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  text-align: start;

  &:active {
    transform: scale(0.98);
  }

  &--primary {
    min-height: 140px;
    background: linear-gradient(135deg, #006C35 0%, #00843D 100%);
    color: white;
    box-shadow: 0 8px 24px rgba(0, 108, 53, 0.3);

    .action-btn__subtitle {
      color: rgba(255, 255, 255, 0.85);
    }
  }

  &--chinese {
    min-height: 80px;
    background: linear-gradient(135deg, #DE2910 0%, #EE1C25 100%);
    color: white;
    box-shadow: 0 4px 16px rgba(222, 41, 16, 0.25);

    .action-btn__icon {
      font-size: 28px;
    }

    .action-btn__title {
      font-size: 16px;
    }

    .action-btn__subtitle {
      color: rgba(255, 255, 255, 0.85);
    }
  }

  &--secondary {
    min-height: 80px;
    background: #ffffff;
    color: $color-text-primary;
    border: 2px solid #e0e0e0;

    .action-btn__icon {
      font-size: 28px;
    }

    .action-btn__title {
      font-size: 16px;
    }

    .action-btn__subtitle {
      color: $color-text-secondary;
    }
  }

  &__icon {
    font-size: 40px;
    margin-inline-end: 16px;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
  }

  &__subtitle {
    font-size: 13px;
  }

  &__arrow {
    margin-inline-start: 12px;
    opacity: 0.7;
  }
}

// Stats Card
.stats-card {
  margin-top: 24px;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e8e8e8;

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: $color-text-secondary;
    margin: 0 0 12px;
  }

  &__grid {
    display: flex;
    justify-content: space-around;
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &__icon {
    font-size: 20px;
  }

  &__value {
    font-size: 24px;
    font-weight: 700;
    color: $color-text-primary;
    font-family: $font-family-mono;
  }

  &__label {
    font-size: 12px;
    color: $color-text-secondary;
  }

  &--total .stat-item__value {
    color: $color-primary;
  }
}

// Language Footer
.language-footer {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

// RTL flip
.flip-rtl {
  [dir="rtl"] & {
    transform: scaleX(-1);
  }
}
</style>
