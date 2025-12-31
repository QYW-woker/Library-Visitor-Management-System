<template>
  <div id="app-container" :class="{ 'is-rtl': isRTL }">
    <router-view />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const isRTL = computed(() => locale.value === 'ar')

// Update HTML attributes when language changes
watch(locale, (newLocale) => {
  const dir = newLocale === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', newLocale)
}, { immediate: true })
</script>

<style lang="scss">
#app-container {
  min-height: 100vh;
  min-height: 100dvh;
}
</style>
