<script setup>
defineProps({
  type: { type: String, default: 'success' },
  message: { type: String, default: '' },
})

defineEmits(['dismiss'])
</script>

<template>
  <div
    v-if="message"
    :class="
      type === 'error' ? 'bg-red-950/60 border-red-900 text-red-200' : 'bg-green-950/50 border-green-900 text-green-200'
    "
    class="border rounded-xl px-4 py-3 flex items-start justify-between gap-3"
  >
    <p class="text-sm">{{ message }}</p>
    <button
      @click="$emit('dismiss')"
      :class="type === 'error' ? 'text-red-300 hover:text-red-100' : 'text-green-300 hover:text-green-100'"
      class="text-xs transition-colors"
    >
      Dismiss
    </button>
  </div>
</template>
