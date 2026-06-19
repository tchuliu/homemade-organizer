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
  <div class="panel">
    <div class="mb-3 flex justify-between gap-3 text-sm muted-copy">
      <span class="mono">Total: {{ formatCurrency(totalBudget) }}</span>
      <span>
        Remaining:
        <span :style="{ color: remaining < 0 ? 'var(--overrun)' : 'var(--receipt)' }">{{
          formatCurrency(remaining)
        }}</span>
      </span>
    </div>
    <div class="budget-track">
      <div
        class="budget-fill"
        :class="remaining < 0 ? 'budget-fill-over' : ''"
        :style="{ width: percentUsed + '%' }"
      ></div>
    </div>
    <p class="mono mt-2 text-xs muted-copy">{{ percentUsed }}% of budget used</p>
  </div>
</template>
