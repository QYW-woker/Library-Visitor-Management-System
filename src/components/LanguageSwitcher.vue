<template>
  <div class="language-switcher">
    <button class="switcher-btn" @click="toggleDropdown">
      <span class="switcher-icon">🌐</span>
      <span class="switcher-label">{{ currentLanguage.name }}</span>
      <svg
        class="switcher-arrow"
        :class="{ 'is-open': isOpen }"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <button
          v-for="lang in languages"
          :key="lang.code"
          class="dropdown-item"
          :class="{ 'is-active': locale === lang.code }"
          @click="selectLanguage(lang.code)"
        >
          <span class="dropdown-item__name">{{ lang.name }}</span>
          <svg
            v-if="locale === lang.code"
            class="dropdown-item__check"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Backdrop -->
    <div v-if="isOpen" class="backdrop" @click="isOpen = false"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage, SUPPORTED_LANGUAGES } from '@/i18n'

const { locale } = useI18n()
const isOpen = ref(false)

const languages = SUPPORTED_LANGUAGES

const currentLanguage = computed(() => {
  return languages.find(l => l.code === locale.value) || languages[0]
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectLanguage(code) {
  setLanguage(code)
  isOpen.value = false
}
</script>

<style lang="scss" scoped>
.language-switcher {
  position: relative;
  z-index: 100;
}

.switcher-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: #eeeeee;
  }
}

.switcher-icon {
  font-size: 18px;
}

.switcher-arrow {
  transition: transform 0.2s;

  &.is-open {
    transform: rotate(180deg);
  }
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 160px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  font-size: 15px;
  cursor: pointer;
  text-align: start;
  transition: background 0.15s;

  &:hover {
    background: #f5f5f5;
  }

  &.is-active {
    color: var(--color-primary);
    font-weight: 500;
  }

  &__check {
    color: var(--color-primary);
  }
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
}

// Animations
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
