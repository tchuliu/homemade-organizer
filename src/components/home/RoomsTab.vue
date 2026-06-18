<script setup>
import { formatCurrency } from '../../lib/currency'

defineProps({
  rooms: { type: Array, default: () => [] },
  deletingRoomId: { type: String, default: '' },
})

defineEmits(['add', 'edit', 'delete'])
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold text-white">Rooms ({{ rooms.length }})</h2>
      <button
        @click="$emit('add')"
        class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
      >
        + Add Room
      </button>
    </div>

    <div v-if="rooms.length === 0" class="text-gray-500 text-center py-12">No rooms yet. Add one to get started.</div>

    <div
      v-for="room in rooms"
      :key="room.id"
      class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4"
    >
      <div>
        <p class="text-white font-medium">{{ room.name }}</p>
        <p class="text-sm text-gray-400">Budget: {{ formatCurrency(room.budget) }}</p>
        <div class="flex items-center gap-2 mt-1">
          <div class="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full bg-indigo-500 rounded-full" :style="{ width: room.percentUsed + '%' }"></div>
          </div>
          <span class="text-xs text-gray-500">{{ room.percentUsed }}%</span>
        </div>
      </div>
      <div class="flex gap-1">
        <button
          @click="$emit('edit', room)"
          class="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
        >
          Edit
        </button>
        <button
          @click="$emit('delete', room.id)"
          :disabled="Boolean(deletingRoomId)"
          class="px-2 py-1 text-xs bg-red-900 hover:bg-red-800 disabled:bg-gray-800 disabled:text-gray-500 text-red-300 rounded transition-colors"
        >
          {{ deletingRoomId === room.id ? 'Deleting...' : 'Del' }}
        </button>
      </div>
    </div>
  </div>
</template>
