<script setup>
const joinId = defineModel('joinId', { type: String, default: '' })
defineEmits(['submit'])
</script>

<template>
  <form @submit.prevent="$emit('submit')" class="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Home ID or URL</label>
      <input
        v-model="joinId"
        placeholder="Paste the Home ID or full URL..."
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
    </div>
    <button
      type="submit"
      :disabled="!joinId.trim()"
      class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2.5 rounded-lg transition-colors"
    >
      Join Home
    </button>
  </form>
</template>
