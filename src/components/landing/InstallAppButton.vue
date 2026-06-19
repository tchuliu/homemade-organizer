<script setup>
defineProps({
  canInstall: { type: Boolean, default: false },
})

defineEmits(['install'])
</script>

<template>
  <div v-if="canInstall" class="flex justify-center">
    <button @click="$emit('install')" class="btn-secondary flex items-center gap-2 px-4 py-2 text-sm">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
      </svg>
      Install App
    </button>
  </div>
</template>
