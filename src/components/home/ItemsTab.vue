<script setup>
import ItemList from '../ItemList.vue'

defineProps({
  items: { type: Array, default: () => [] },
  rooms: { type: Array, default: () => [] },
})

const itemFilterRoom = defineModel('itemFilterRoom', { type: String, default: '' })
defineEmits(['add', 'edit', 'delete', 'quickAdd'])
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap justify-between items-center gap-3">
      <h2 class="section-title">Items ({{ items.length }})</h2>
      <div class="flex gap-2">
        <select v-model="itemFilterRoom" class="field py-2 text-sm">
          <option value="">All Rooms</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
        </select>
        <button @click="$emit('add')" :disabled="rooms.length === 0" class="btn-primary px-4 py-2 text-sm">
          + Add Item
        </button>
      </div>
    </div>
    <ItemList
      :items="items"
      :rooms="rooms"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
      @quick-add="$emit('quickAdd', $event)"
    />
  </div>
</template>
