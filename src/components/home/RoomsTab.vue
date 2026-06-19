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
      <h2 class="section-title">Rooms ({{ rooms.length }})</h2>
      <button @click="$emit('add')" class="btn-primary px-4 py-2 text-sm">+ Add Room</button>
    </div>

    <div v-if="rooms.length === 0" class="panel py-12 text-center muted-copy">
      No rooms yet. Add one to get started.
    </div>

    <div v-for="room in rooms" :key="room.id" class="receipt-card flex items-center justify-between gap-4 p-4">
      <div>
        <p class="text-lg font-bold">{{ room.name }}</p>
        <p class="text-sm muted-copy">Budget: {{ formatCurrency(room.budget) }}</p>
        <div class="flex items-center gap-2 mt-1">
          <div class="budget-track w-28 !h-2">
            <div class="budget-fill" :style="{ width: room.percentUsed + '%' }"></div>
          </div>
          <span class="mono text-xs muted-copy">{{ room.percentUsed }}%</span>
        </div>
      </div>
      <div class="flex gap-1">
        <button @click="$emit('edit', room)" class="btn-secondary px-3 py-1.5 text-xs">Edit</button>
        <button
          @click="$emit('delete', room.id)"
          :disabled="Boolean(deletingRoomId)"
          class="btn-danger px-3 py-1.5 text-xs"
        >
          {{ deletingRoomId === room.id ? 'Deleting...' : 'Del' }}
        </button>
      </div>
    </div>
  </div>
</template>
