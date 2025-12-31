<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="sidebar-logo">🏛</span>
        <div class="sidebar-title">
          <h1>KFNLAI</h1>
          <span>Admin</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/admin" class="nav-item" exact-active-class="nav-item--active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
          <span>{{ t('admin.nav.dashboard') }}</span>
        </router-link>

        <router-link to="/admin/visitors" class="nav-item" active-class="nav-item--active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>{{ t('admin.nav.visitors') }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <LanguageSwitcher />
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const { t } = useI18n()
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: $color-bg-secondary;
}

// Sidebar
.sidebar {
  width: 240px;
  background: #ffffff;
  border-inline-end: 1px solid $color-border;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  bottom: 0;
  inset-inline-start: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid $color-border-light;
}

.sidebar-logo {
  font-size: 32px;
}

.sidebar-title {
  h1 {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: $color-primary;
  }

  span {
    font-size: 12px;
    color: $color-text-secondary;
  }
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: $color-text-secondary;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  margin-bottom: 4px;

  &:hover {
    background: $color-bg-secondary;
    color: $color-text-primary;
  }

  &--active {
    background: rgba($color-primary, 0.1);
    color: $color-primary;

    svg {
      stroke: $color-primary;
    }
  }
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid $color-border-light;
}

// Main Content
.main-content {
  flex: 1;
  margin-inline-start: 240px;
  padding: 24px;
  min-height: 100vh;
}

// Responsive
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: relative;
    border-inline-end: none;
    border-bottom: 1px solid $color-border;
  }

  .admin-layout {
    flex-direction: column;
  }

  .main-content {
    margin-inline-start: 0;
  }
}
</style>
