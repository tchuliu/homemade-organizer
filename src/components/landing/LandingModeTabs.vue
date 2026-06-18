<script setup>
const mode = defineModel({ type: String, required: true })
</script>

<template>
  <div class="flex gap-2 justify-center">
    <button
      @click="mode = 'create'"
      :class="mode === 'create' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'"
      class="px-4 py-2 rounded-lg font-medium transition-colors"
    >
      New Home
    </button>
    <button
      @click="mode = 'join'"
      :class="mode === 'join' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'"
      class="px-4 py-2 rounded-lg font-medium transition-colors"
    >
      Join Existing
    </button>
  </div>
</template>
