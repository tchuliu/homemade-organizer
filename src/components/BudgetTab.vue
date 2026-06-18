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
const roomSummaries = computed(() =>
  props.rooms.map((room) => {
    const spent = roomSpent(room.id)
    const budget = Number(room.budget) || 0
    return {
      ...room,
      spent,
      budget,
      itemCount: roomItemCount(room.id),
      percentUsed: percent(spent, budget),
      isOverBudget: spent > budget,
    }
  }),
)

function roomSpent(roomId) {
  return props.items.filter((i) => i.room_id === roomId).reduce((sum, i) => sum + itemEstimate(i), 0)
}

function roomItemCount(roomId) {
  return props.items.filter((i) => i.room_id === roomId).length
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
          <p class="text-2xl font-bold" :class="remaining < 0 ? 'text-red-400' : 'text-green-400'">
            {{ formatCurrency(remaining) }}
          </p>
          <p class="text-xs text-gray-500 mt-1">Remaining</p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-md font-semibold text-white mb-3">Per Room</h3>
      <div v-if="roomSummaries.length === 0" class="text-gray-500 text-center py-6">No rooms yet.</div>
      <div v-for="room in roomSummaries" :key="room.id" class="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-3">
        <div class="flex justify-between items-center mb-2">
          <p class="text-white font-medium">{{ room.name }}</p>
          <p class="text-sm text-gray-400">
            {{ formatCurrency(room.spent) }}
            /
            {{ formatCurrency(room.budget) }}
          </p>
        </div>
        <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="room.isOverBudget ? 'bg-red-500' : 'bg-indigo-500'"
            :style="{ width: room.percentUsed + '%' }"
          ></div>
        </div>
        <p class="text-xs text-gray-500 mt-1">{{ room.itemCount }} items &middot; {{ room.percentUsed }}% used</p>
      </div>
    </div>
  </div>
</template>
