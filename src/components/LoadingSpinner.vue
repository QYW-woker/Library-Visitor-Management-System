<template>
  <div class="loading-spinner" :class="[`size-${size}`]">
    <div class="spinner"></div>
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (v) => ['small', 'medium', 'large'].includes(v)
  }
})
</script>

<style lang="scss" scoped>
.loading-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  border-radius: 50%;
  border-style: solid;
  border-color: currentColor;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

.size-small .spinner {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.size-medium .spinner {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

.size-large .spinner {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
