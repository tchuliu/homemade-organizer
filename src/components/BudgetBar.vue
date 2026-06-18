<script setup>
import { formatCurrency } from '../lib/currency'

defineProps({
  totalBudget: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  percentUsed: { type: Number, default: 0 },
})
</script>

<template>
  <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
    <div class="flex justify-between text-sm text-gray-400 mb-1">
      <span>Total: {{ formatCurrency(totalBudget) }}</span>
      <span>
        Remaining:
        <span :class="remaining < 0 ? 'text-red-400' : 'text-green-400'">{{ formatCurrency(remaining) }}</span>
      </span>
    </div>
    <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all"
        :class="remaining < 0 ? 'bg-red-500' : 'bg-indigo-500'"
        :style="{ width: percentUsed + '%' }"
      ></div>
    </div>
    <p class="text-xs text-gray-500 mt-1">{{ percentUsed }}% of budget used</p>
  </div>
</template>
