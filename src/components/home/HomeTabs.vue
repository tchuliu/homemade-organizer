<script setup>
const activeTab = defineModel({ type: String, required: true })

const tabs = ['rooms', 'items', 'budget']
</script>

<template>
  <div class="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
    <button
      v-for="tab in tabs"
      :key="tab"
      @click="activeTab = tab"
      :class="activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'"
      class="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
    >
      {{ tab }}
    </button>
  </div>
</template>
