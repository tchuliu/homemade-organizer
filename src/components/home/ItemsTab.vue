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
      <h2 class="text-lg font-semibold text-white">Items ({{ items.length }})</h2>
      <div class="flex gap-2">
        <select
          v-model="itemFilterRoom"
          class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Rooms</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
        </select>
        <button
          @click="$emit('add')"
          :disabled="rooms.length === 0"
          class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-lg transition-colors"
        >
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
