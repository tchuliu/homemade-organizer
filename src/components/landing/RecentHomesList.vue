<script setup>
defineProps({
  homes: { type: Array, default: () => [] },
})

defineEmits(['open'])

function shortHomeId(homeId) {
  return homeId ? `${homeId.slice(0, 8)}...` : ''
}
</script>

<template>
  <div v-if="homes.length" class="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
    <div>
      <h2 class="text-sm font-semibold text-white">Recent homes</h2>
      <p class="text-xs text-gray-500">Quickly reopen a home you accessed before.</p>
    </div>
    <div class="space-y-2">
      <button
        v-for="home in homes"
        :key="home.id"
        @click="$emit('open', home.id)"
        class="w-full text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 transition-colors"
      >
        <span class="block text-sm font-medium text-white truncate">{{ home.name || 'Unnamed home' }}</span>
        <span class="block text-xs text-gray-500">ID: {{ shortHomeId(home.id) }}</span>
      </button>
    </div>
  </div>
</template>
