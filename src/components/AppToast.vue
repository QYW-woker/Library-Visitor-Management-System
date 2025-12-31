<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast" :class="[`toast--${type}`]">
        <span class="toast__icon">{{ icon }}</span>
        <span class="toast__message">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  message: String,
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['success', 'error', 'warning', 'info'].includes(v)
  },
  duration: {
    type: Number,
    default: 3000
  },
  show: Boolean
})

const emit = defineEmits(['close'])

const visible = ref(false)

const icon = computed(() => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }
  return icons[props.type]
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    visible.value = true
    if (props.duration > 0) {
      setTimeout(() => {
        visible.value = false
        emit('close')
      }, props.duration)
    }
  } else {
    visible.value = false
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.toast {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 9999;

  &--success {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &--error {
    background: #ffebee;
    color: #c62828;
  }

  &--warning {
    background: #fff3e0;
    color: #e65100;
  }

  &--info {
    background: #e3f2fd;
    color: #1565c0;
  }

  &__icon {
    font-size: 16px;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
