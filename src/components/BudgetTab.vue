<script setup>
import { computed } from 'vue'
import { formatCurrency } from '../lib/currency'
import { itemEstimate } from '../lib/purchaseOptions'

const props = defineProps({
  totalBudget: { type: Number, default: 0 },
  rooms: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
})

const totalSpent = computed(() => props.items.reduce((sum, i) => sum + itemEstimate(i), 0))
const remaining = computed(() => props.totalBudget - totalSpent.value)

function roomSpent(roomId) {
  return props.items.filter(i => i.room_id === roomId).reduce((sum, i) => sum + itemEstimate(i), 0)
}

function roomBudget(roomId) {
  return Number(props.rooms.find(r => r.id === roomId)?.budget) || 0
}

function roomItemCount(roomId) {
  return props.items.filter(i => i.room_id === roomId).length
}

function percent(spent, budget) {
  if (!budget) return 0
  return Math.min(100, Math.round((spent / budget) * 100))
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-white mb-4">Budget Overview</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-white">{{ formatCurrency(totalBudget) }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Budget</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-indigo-400">{{ formatCurrency(totalSpent) }}</p>
          <p class="text-xs text-gray-500 mt-1">Current Estimate</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold" :class="remaining < 0 ? 'text-red-400' : 'text-green-400'">{{ formatCurrency(remaining) }}</p>
          <p class="text-xs text-gray-500 mt-1">Remaining</p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-md font-semibold text-white mb-3">Per Room</h3>
      <div v-if="rooms.length === 0" class="text-gray-500 text-center py-6">No rooms yet.</div>
      <div v-for="room in rooms" :key="room.id" class="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-3">
        <div class="flex justify-between items-center mb-2">
          <p class="text-white font-medium">{{ room.name }}</p>
          <p class="text-sm text-gray-400">
            {{ formatCurrency(roomSpent(room.id)) }}
            /
            {{ formatCurrency(room.budget) }}
          </p>
        </div>
        <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="roomSpent(room.id) > room.budget ? 'bg-red-500' : 'bg-indigo-500'"
            :style="{ width: percent(roomSpent(room.id), room.budget) + '%' }"
          ></div>
        </div>
        <p class="text-xs text-gray-500 mt-1">
          {{ roomItemCount(room.id) }} items &middot;
          {{ percent(roomSpent(room.id), room.budget) }}% used
        </p>
      </div>
    </div>
  </div>
</template>
