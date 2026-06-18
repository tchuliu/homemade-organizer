<script setup>
import { computed, ref } from 'vue'
import { formatCurrency } from '../lib/currency'
import {
  itemEstimate,
  hasOptionEstimate,
  lowestOption,
  optionPrice,
  purchaseOptionsFromItem,
} from '../lib/purchaseOptions'

const props = defineProps({
  items: { type: Array, default: () => [] },
  rooms: { type: Array, default: () => [] },
})

defineEmits(['edit', 'delete', 'quickAdd'])

const priorityColors = { high: 'text-red-400', medium: 'text-yellow-400', low: 'text-green-400' }
const statusColors = {
  planned: 'bg-gray-700 text-gray-300',
  researching: 'bg-blue-900 text-blue-300',
  bought: 'bg-green-900 text-green-300',
}
const expandedNoteIds = ref(new Set())

const displayItems = computed(() =>
  props.items.map((item) => {
    const options = purchaseOptionsFromItem(item)
    const lowest = lowestOption(item)
    return {
      item,
      options,
      lowest,
      roomName: getRoomName(item.room_id),
      estimate: itemEstimate(item),
      hasOptionEstimate: hasOptionEstimate(item),
      noteText: noteText(item),
      shouldCollapseNote: shouldCollapseNote(item.notes),
      isNoteExpanded: isNoteExpanded(item.id),
    }
  }),
)

function getRoomName(roomId) {
  return props.rooms.find((r) => r.id === roomId)?.name || 'Unknown'
}

function vendorHref(link) {
  return typeof link === 'string' ? link : link.url
}

function vendorLabel(link, index) {
  if (typeof link === 'object' && link?.label) return link.label
  const href = vendorHref(link)
  if (!href) return `Vendor ${index + 1}`
  try {
    const host = new URL(href).hostname.replace(/^www\./, '')
    return host || `Vendor ${index + 1}`
  } catch (e) {
    return `Vendor ${index + 1}`
  }
}

function shouldCollapseNote(notes) {
  return (notes || '').length > 180 || (notes || '').split('\n').length > 4
}

function isNoteExpanded(itemId) {
  return expandedNoteIds.value.has(itemId)
}

function noteText(item) {
  if (!shouldCollapseNote(item.notes) || isNoteExpanded(item.id)) return item.notes
  return `${item.notes.slice(0, 180).trim()}...`
}

function toggleNote(itemId) {
  const nextExpanded = new Set(expandedNoteIds.value)
  if (nextExpanded.has(itemId)) nextExpanded.delete(itemId)
  else nextExpanded.add(itemId)
  expandedNoteIds.value = nextExpanded
}
</script>

<template>
  <div v-if="displayItems.length === 0" class="text-gray-500 text-center py-12">
    No items yet. Add one to get started.
  </div>
  <div
    v-for="displayItem in displayItems"
    :key="displayItem.item.id"
    class="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2"
  >
    <div class="flex justify-between items-start gap-3">
      <div>
        <p class="text-white font-medium">{{ displayItem.item.name }}</p>
        <p class="text-xs text-gray-500">{{ displayItem.roomName }} &middot; {{ displayItem.item.type }}</p>
      </div>
      <div class="flex gap-1 shrink-0">
        <button
          @click="$emit('edit', displayItem.item)"
          class="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
        >
          Edit
        </button>
        <button
          @click="$emit('delete', displayItem.item)"
          class="px-2 py-1 text-xs bg-red-900 hover:bg-red-800 text-red-300 rounded transition-colors"
        >
          Del
        </button>
      </div>
    </div>
    <div class="flex flex-wrap gap-2 items-center">
      <span class="text-sm text-indigo-300 font-medium">{{ formatCurrency(displayItem.estimate) }}</span>
      <span class="text-xs text-gray-500">{{
        displayItem.hasOptionEstimate ? 'Preferred option' : 'Manual estimate'
      }}</span>
      <span v-if="displayItem.lowest" class="text-xs text-gray-500"
        >Lowest: {{ formatCurrency(optionPrice(displayItem.lowest)) }}</span
      >
      <span :class="priorityColors[displayItem.item.priority]" class="text-xs capitalize"
        >{{ displayItem.item.priority }} priority</span
      >
      <span :class="statusColors[displayItem.item.status]" class="text-xs px-2 py-0.5 rounded-full capitalize">{{
        displayItem.item.status
      }}</span>
      <button
        v-if="!displayItem.options.length"
        @click="$emit('quickAdd', displayItem.item)"
        class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors ml-1"
      >
        + Add option
      </button>
    </div>
    <div v-if="displayItem.item.notes" class="space-y-1">
      <p class="text-sm text-gray-400 whitespace-pre-line break-words max-h-32 overflow-y-auto">
        {{ displayItem.noteText }}
      </p>
      <button
        v-if="displayItem.shouldCollapseNote"
        @click="toggleNote(displayItem.item.id)"
        class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        {{ displayItem.isNoteExpanded ? 'Show less' : 'Show more' }}
      </button>
    </div>
    <div v-if="displayItem.options.length" class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Purchase options</p>
        <button
          @click="$emit('quickAdd', displayItem.item)"
          class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          + Add option
        </button>
      </div>
      <div class="divide-y divide-gray-800 overflow-hidden rounded-lg border border-gray-800">
        <div v-for="(option, i) in displayItem.options" :key="i" class="flex flex-wrap items-start gap-3 px-3 py-2">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-gray-200">{{ option.label || vendorLabel(option, i) }}</p>
            <p class="text-xs text-gray-500">
              <span v-if="option.store">{{ option.store }}</span>
              <span v-if="option.store && vendorHref(option)"> &middot; </span>
              <a
                v-if="vendorHref(option)"
                :href="vendorHref(option)"
                target="_blank"
                rel="noopener"
                class="text-indigo-400 hover:text-indigo-300 underline"
                :title="vendorHref(option)"
                >Open link</a
              >
            </p>
            <p v-if="option.notes" class="mt-1 text-xs text-gray-500 whitespace-pre-line break-words">
              {{ option.notes }}
            </p>
          </div>
          <div class="text-right">
            <p v-if="optionPrice(option)" class="text-sm font-medium text-gray-200">
              {{ formatCurrency(optionPrice(option)) }}
            </p>
            <p v-if="option.purchased" class="text-xs text-green-300">Purchased</p>
            <p v-else-if="option.selected" class="text-xs text-green-400">Preferred</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
