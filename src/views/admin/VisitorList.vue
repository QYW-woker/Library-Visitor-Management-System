<template>
  <div class="visitor-list">
    <h1 class="page-title">{{ t('admin.visitors.title') }}</h1>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="M21 21l-4.35-4.35"></path>
        </svg>
        <input
          v-model="filters.keyword"
          type="text"
          :placeholder="t('admin.visitors.search.placeholder')"
          @input="applyFilters"
        />
      </div>

      <div class="filter-group">
        <select v-model="filters.type" class="filter-select" @change="applyFilters">
          <option value="ALL">{{ t('admin.visitors.filter.all') }}</option>
          <option value="SAUDI">{{ t('admin.visitors.filter.saudi') }}</option>
          <option value="FOREIGN">{{ t('admin.visitors.filter.foreign') }}</option>
        </select>

        <input
          v-model="filters.dateFrom"
          type="date"
          class="filter-date"
          @change="applyFilters"
        />
        <span class="filter-separator">-</span>
        <input
          v-model="filters.dateTo"
          type="date"
          class="filter-date"
          @change="applyFilters"
        />

        <button class="reset-btn" @click="resetFilters">
          {{ t('common.reset') }}
        </button>
      </div>
    </div>

    <!-- Results Count -->
    <div class="results-info">
      {{ filteredVisitors.length }} {{ t('common.visitors') }}
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="visitors-table">
        <thead>
          <tr>
            <th>{{ t('admin.visitors.table.visitorType') }}</th>
            <th>{{ t('admin.visitors.table.fullName') }}</th>
            <th>{{ t('admin.visitors.table.mobileNumber') }}</th>
            <th>{{ t('admin.visitors.table.passportNumber') }}</th>
            <th>{{ t('admin.visitors.table.nationality') }}</th>
            <th>{{ t('admin.visitors.table.visitDate') }}</th>
            <th>{{ t('admin.visitors.table.entryTime') }}</th>
            <th>{{ t('admin.visitors.table.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="visitor in paginatedVisitors" :key="visitor.id">
            <td>
              <span class="visitor-type-badge" :class="`visitor-type-badge--${visitor.visitorType.toLowerCase()}`">
                {{ visitor.visitorType === 'SAUDI' ? '🇸🇦 Saudi' : '🌍 Foreign' }}
              </span>
            </td>
            <td class="name-cell">{{ visitor.fullName }}</td>
            <td class="mono">{{ visitor.mobileNumber || '-' }}</td>
            <td class="mono">{{ visitor.passportNumber || '-' }}</td>
            <td>{{ visitor.nationalityName || (visitor.visitorType === 'SAUDI' ? t('nationality.SA') : '-') }}</td>
            <td class="mono">{{ visitor.visitDate }}</td>
            <td class="mono">{{ visitor.entryTime }}</td>
            <td>
              <span class="status-badge" :class="`status-badge--${visitor.status.toLowerCase()}`">
                {{ t(`admin.visitors.status.${visitor.status.toLowerCase()}`) }}
              </span>
            </td>
          </tr>
          <tr v-if="filteredVisitors.length === 0">
            <td colspan="8" class="empty-cell">
              {{ t('admin.visitors.empty') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip-rtl">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <span class="page-info">
        {{ currentPage }} / {{ totalPages }}
      </span>

      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip-rtl">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVisitorStore } from '@/stores/visitor'

const { t } = useI18n()
const visitorStore = useVisitorStore()

const filters = ref({
  keyword: '',
  type: 'ALL',
  dateFrom: '',
  dateTo: ''
})

const currentPage = ref(1)
const pageSize = 10

const filteredVisitors = computed(() => {
  return visitorStore.filterVisitors({
    type: filters.value.type,
    dateFrom: filters.value.dateFrom,
    dateTo: filters.value.dateTo,
    keyword: filters.value.keyword
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredVisitors.value.length / pageSize)
})

const paginatedVisitors = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredVisitors.value.slice(start, start + pageSize)
})

onMounted(() => {
  visitorStore.initDemoData()
})

function applyFilters() {
  currentPage.value = 1
}

function resetFilters() {
  filters.value = {
    keyword: '',
    type: 'ALL',
    dateFrom: '',
    dateTo: ''
  }
  currentPage.value = 1
}
</script>

<style lang="scss" scoped>
.visitor-list {
  max-width: 1400px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px;
  color: $color-text-primary;
}

// Filters
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: $shadow-sm;
}

.search-box {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  background: $color-bg-secondary;
  border-radius: 8px;
  border: 1px solid $color-border;

  svg {
    color: $color-text-tertiary;
    flex-shrink: 0;
  }

  input {
    flex: 1;
    height: 42px;
    border: none;
    background: transparent;
    font-size: 14px;
  }
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-select,
.filter-date {
  height: 42px;
  padding: 0 12px;
  border: 1px solid $color-border;
  border-radius: 8px;
  background: #ffffff;
  font-size: 14px;
  color: $color-text-primary;
}

.filter-select {
  min-width: 140px;
}

.filter-date {
  width: 140px;
}

.filter-separator {
  color: $color-text-tertiary;
}

.reset-btn {
  height: 42px;
  padding: 0 16px;
  background: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: 8px;
  font-size: 14px;
  color: $color-text-secondary;

  &:hover {
    background: $color-border-light;
  }
}

// Results Info
.results-info {
  font-size: 14px;
  color: $color-text-secondary;
  margin-bottom: 12px;
}

// Table
.table-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: $shadow-sm;
  overflow: hidden;
}

.visitors-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 14px 16px;
    text-align: start;
    border-bottom: 1px solid $color-border-light;
  }

  th {
    font-size: 12px;
    font-weight: 600;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: $color-bg-tertiary;
  }

  td {
    font-size: 14px;
    color: $color-text-primary;
  }

  tbody tr:hover {
    background: $color-bg-tertiary;
  }
}

.visitor-type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;

  &--saudi {
    background: rgba(0, 108, 53, 0.1);
    color: #006C35;
  }

  &--foreign {
    background: rgba(25, 118, 210, 0.1);
    color: #1976D2;
  }
}

.name-cell {
  font-weight: 500;
}

.mono {
  font-family: $font-family-mono;
  font-size: 13px;
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
  padding: 48px !important;
}

// Pagination
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.page-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid $color-border;

  &:hover:not(:disabled) {
    background: $color-bg-secondary;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.page-info {
  font-size: 14px;
  color: $color-text-secondary;
}

.flip-rtl {
  [dir="rtl"] & {
    transform: scaleX(-1);
  }
}

// Responsive
@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .table-container {
    overflow-x: auto;
  }
}
</style>
