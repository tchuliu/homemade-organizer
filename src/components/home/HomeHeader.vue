<script setup>
defineProps({
  home: { type: Object, required: true },
})

defineEmits(['back', 'copyLink'])
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-white">{{ home.name }}</h1>
      <p class="text-sm text-gray-500">ID: {{ home.id }}</p>
    </div>
    <div class="flex gap-2">
      <button
        @click="$emit('back')"
        class="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
      >
        Home
      </button>
      <button
        @click="$emit('copyLink')"
        class="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
      >
        Copy Link
      </button>
    </div>
  </div>
</template>
