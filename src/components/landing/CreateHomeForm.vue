<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const form = defineModel('form', { type: Object, required: true })
defineEmits(['submit'])
</script>

<template>
  <form @submit.prevent="$emit('submit')" class="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Home Name</label>
      <input
        v-model="form.name"
        placeholder="e.g. Our New Apartment"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Total Budget (optional)</label>
      <input
        v-model="form.totalBudget"
        type="number"
        step="0.01"
        placeholder="0.00"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
    </div>
    <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
    <button
      type="submit"
      :disabled="loading || !form.name.trim()"
      class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2.5 rounded-lg transition-colors"
    >
      {{ loading ? 'Creating...' : 'Create Home' }}
    </button>
  </form>
</template>
