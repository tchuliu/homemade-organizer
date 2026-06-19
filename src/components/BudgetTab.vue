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
      <h2 class="section-title mb-4">Budget Overview</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="receipt-card p-4 text-center">
          <p class="text-2xl font-bold">{{ formatCurrency(totalBudget) }}</p>
          <p class="mono mt-1 text-xs muted-copy">Total Budget</p>
        </div>
        <div class="receipt-card p-4 text-center">
          <p class="text-2xl font-bold" style="color: var(--tape)">{{ formatCurrency(totalSpent) }}</p>
          <p class="mono mt-1 text-xs muted-copy">Current Estimate</p>
        </div>
        <div class="receipt-card p-4 text-center">
          <p class="text-2xl font-bold" :style="{ color: remaining < 0 ? 'var(--overrun)' : 'var(--receipt)' }">
            {{ formatCurrency(remaining) }}
          </p>
          <p class="mono mt-1 text-xs muted-copy">Remaining</p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="mono mb-3 text-sm font-semibold uppercase tracking-[0.16em]" style="color: var(--tape)">Per Room</h3>
      <div v-if="roomSummaries.length === 0" class="panel py-6 text-center muted-copy">No rooms yet.</div>
      <div v-for="room in roomSummaries" :key="room.id" class="receipt-card mb-3 p-4">
        <div class="flex justify-between items-center mb-2">
          <p class="font-bold">{{ room.name }}</p>
          <p class="text-sm muted-copy">
            {{ formatCurrency(room.spent) }}
            /
            {{ formatCurrency(room.budget) }}
          </p>
        </div>
        <div class="budget-track">
          <div
            class="budget-fill"
            :class="room.isOverBudget ? 'budget-fill-over' : ''"
            :style="{ width: room.percentUsed + '%' }"
          ></div>
        </div>
        <p class="mono mt-2 text-xs muted-copy">{{ room.itemCount }} items &middot; {{ room.percentUsed }}% used</p>
      </div>
    </div>
  </div>
</template>
