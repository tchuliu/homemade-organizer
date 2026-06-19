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
      type === 'error'
        ? 'border-[rgba(212,106,94,0.42)] text-[#f2b9b2]'
        : 'border-[rgba(111,175,138,0.42)] text-[#b8d8c3]'
    "
    class="receipt-card flex items-start justify-between gap-3 px-4 py-3"
  >
    <p class="text-sm">{{ message }}</p>
    <button @click="$emit('dismiss')" class="mono text-xs transition-colors hover:opacity-80">Dismiss</button>
  </div>
</template>
