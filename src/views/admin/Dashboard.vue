<template>
  <div class="dashboard">
    <h1 class="page-title">{{ t('admin.dashboard.title') }}</h1>

    <!-- Today's Overview -->
    <section class="overview-section">
      <h2 class="section-title">{{ t('admin.dashboard.todayOverview') }}</h2>
      <div class="stats-grid">
        <div class="stat-card stat-card--total">
          <div class="stat-card__icon">📊</div>
          <div class="stat-card__content">
            <span class="stat-card__value">{{ stats.totalVisitors }}</span>
            <span class="stat-card__label">{{ t('staff.home.todayStats.total') }}</span>
          </div>
        </div>

        <div class="stat-card stat-card--saudi">
          <div class="stat-card__icon">🇸🇦</div>
          <div class="stat-card__content">
            <span class="stat-card__value">{{ stats.saudiVisitors }}</span>
            <span class="stat-card__label">{{ t('staff.home.todayStats.saudi') }}</span>
          </div>
        </div>

        <div class="stat-card stat-card--foreign">
          <div class="stat-card__icon">🌍</div>
          <div class="stat-card__content">
            <span class="stat-card__value">{{ stats.foreignVisitors }}</span>
            <span class="stat-card__label">{{ t('staff.home.todayStats.foreign') }}</span>
          </div>
        </div>

        <div class="stat-card stat-card--active">
          <div class="stat-card__icon">🏛</div>
          <div class="stat-card__content">
            <span class="stat-card__value">{{ stats.currentlyInLibrary }}</span>
            <span class="stat-card__label">{{ t('admin.visitors.status.active') }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Visitors -->
    <section class="recent-section">
      <div class="section-header">
        <h2 class="section-title">{{ t('admin.dashboard.recentVisitors') }}</h2>
        <router-link to="/admin/visitors" class="view-all-link">
          {{ t('admin.dashboard.viewAll') }} →
        </router-link>
      </div>

      <div class="visitors-table">
        <table>
          <thead>
            <tr>
              <th>{{ t('admin.visitors.table.visitorType') }}</th>
              <th>{{ t('admin.visitors.table.fullName') }}</th>
              <th>{{ t('admin.visitors.table.mobileNumber') }}</th>
              <th>{{ t('admin.visitors.table.entryTime') }}</th>
              <th>{{ t('admin.visitors.table.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="visitor in recentVisitors" :key="visitor.id">
              <td>
                <span class="visitor-type" :class="`visitor-type--${visitor.visitorType.toLowerCase()}`">
                  {{ visitor.visitorType === 'SAUDI' ? '🇸🇦' : '🌍' }}
                </span>
              </td>
              <td class="name-cell">{{ visitor.fullName }}</td>
              <td class="mono">{{ visitor.mobileNumber || '-' }}</td>
              <td class="mono">{{ visitor.entryTime }}</td>
              <td>
                <span class="status-badge" :class="`status-badge--${visitor.status.toLowerCase()}`">
                  {{ t(`admin.visitors.status.${visitor.status.toLowerCase()}`) }}
                </span>
              </td>
            </tr>
            <tr v-if="recentVisitors.length === 0">
              <td colspan="5" class="empty-cell">{{ t('admin.visitors.empty') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVisitorStore } from '@/stores/visitor'

const { t } = useI18n()
const visitorStore = useVisitorStore()

const stats = computed(() => visitorStore.todayStats)
const recentVisitors = computed(() => visitorStore.getRecentVisitors(5))

onMounted(() => {
  visitorStore.initDemoData()
})
</script>

<style lang="scss" scoped>
.dashboard {
  max-width: 1200px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px;
  color: $color-text-primary;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  color: $color-text-primary;
}

// Overview Section
.overview-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: $shadow-sm;

  &__icon {
    font-size: 32px;
  }

  &__content {
    display: flex;
    flex-direction: column;
  }

  &__value {
    font-size: 28px;
    font-weight: 700;
    font-family: $font-family-mono;
    color: $color-text-primary;
  }

  &__label {
    font-size: 13px;
    color: $color-text-secondary;
  }

  &--total {
    border-inline-start: 4px solid $color-primary;
  }

  &--saudi {
    border-inline-start: 4px solid #006C35;
  }

  &--foreign {
    border-inline-start: 4px solid $color-secondary;
  }

  &--active {
    border-inline-start: 4px solid $color-success;
  }
}

// Recent Section
.recent-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: $shadow-sm;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .section-title {
    margin: 0;
  }
}

.view-all-link {
  font-size: 14px;
  color: $color-primary;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

// Table
.visitors-table {
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 12px 16px;
    text-align: start;
    border-bottom: 1px solid $color-border-light;
  }

  th {
    font-size: 12px;
    font-weight: 600;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    font-size: 14px;
    color: $color-text-primary;
  }

  tbody tr:hover {
    background: $color-bg-tertiary;
  }
}

.visitor-type {
  font-size: 20px;
}

.name-cell {
  font-weight: 500;
}

.mono {
  font-family: $font-family-mono;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;

  &--active {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &--exited {
    background: #f5f5f5;
    color: #757575;
  }

  &--cancelled {
    background: #ffebee;
    color: #c62828;
  }
}

.empty-cell {
  text-align: center;
  color: $color-text-tertiary;
  padding: 32px !important;
}
</style>
