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

const priorityColors = { high: 'text-[#f2b9b2]', medium: 'text-[#f0b64a]', low: 'text-[#9ec9ae]' }
const statusColors = {
  planned: 'bg-[rgba(231,222,208,0.1)] text-[#e7ded0]',
  researching: 'bg-[rgba(217,154,43,0.16)] text-[#f0b64a]',
  bought: 'bg-[rgba(111,175,138,0.16)] text-[#9ec9ae]',
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
  <div v-if="displayItems.length === 0" class="panel py-12 text-center muted-copy">
    No items yet. Add one to get started.
  </div>
  <div v-for="displayItem in displayItems" :key="displayItem.item.id" class="receipt-card space-y-3 p-4">
    <div class="flex justify-between items-start gap-3">
      <div>
        <p class="text-lg font-bold">{{ displayItem.item.name }}</p>
        <p class="mono text-xs muted-copy">{{ displayItem.roomName }} &middot; {{ displayItem.item.type }}</p>
      </div>
      <div class="flex gap-1 shrink-0">
        <button @click="$emit('edit', displayItem.item)" class="btn-secondary px-3 py-1.5 text-xs">Edit</button>
        <button @click="$emit('delete', displayItem.item)" class="btn-danger px-3 py-1.5 text-xs">Del</button>
      </div>
    </div>
    <div class="flex flex-wrap gap-2 items-center">
      <span class="mono text-sm font-semibold" style="color: var(--tape)">{{
        formatCurrency(displayItem.estimate)
      }}</span>
      <span class="text-xs muted-copy">{{
        displayItem.hasOptionEstimate ? 'Preferred option' : 'Manual estimate'
      }}</span>
      <span v-if="displayItem.lowest" class="text-xs muted-copy"
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
        class="mono ml-1 text-xs transition-colors hover:opacity-80"
        style="color: var(--tape)"
      >
        + Add option
      </button>
    </div>
    <div v-if="displayItem.item.notes" class="space-y-1">
      <p class="max-h-32 overflow-y-auto whitespace-pre-line break-words text-sm muted-copy">
        {{ displayItem.noteText }}
      </p>
      <button
        v-if="displayItem.shouldCollapseNote"
        @click="toggleNote(displayItem.item.id)"
        class="mono text-xs transition-colors hover:opacity-80"
        style="color: var(--tape)"
      >
        {{ displayItem.isNoteExpanded ? 'Show less' : 'Show more' }}
      </button>
    </div>
    <div v-if="displayItem.options.length" class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <p class="mono text-xs font-medium uppercase tracking-[0.16em] muted-copy">Purchase options</p>
        <button
          @click="$emit('quickAdd', displayItem.item)"
          class="mono text-xs transition-colors hover:opacity-80"
          style="color: var(--tape)"
        >
          + Add option
        </button>
      </div>
      <div
        class="overflow-hidden rounded-xl border border-[rgba(231,222,208,0.13)] divide-y divide-[rgba(231,222,208,0.1)]"
      >
        <div v-for="(option, i) in displayItem.options" :key="i" class="flex flex-wrap items-start gap-3 px-3 py-2">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold">{{ option.label || vendorLabel(option, i) }}</p>
            <p class="text-xs muted-copy">
              <span v-if="option.store">{{ option.store }}</span>
              <span v-if="option.store && vendorHref(option)"> &middot; </span>
              <a
                v-if="vendorHref(option)"
                :href="vendorHref(option)"
                target="_blank"
                rel="noopener"
                class="underline transition-colors hover:opacity-80"
                style="color: var(--tape)"
                :title="vendorHref(option)"
                >Open link</a
              >
            </p>
            <p v-if="option.notes" class="mt-1 whitespace-pre-line break-words text-xs muted-copy">
              {{ option.notes }}
            </p>
          </div>
          <div class="text-right">
            <p v-if="optionPrice(option)" class="mono text-sm font-semibold">
              {{ formatCurrency(optionPrice(option)) }}
            </p>
            <p v-if="option.purchased" class="text-xs" style="color: var(--receipt)">Purchased</p>
            <p v-else-if="option.selected" class="text-xs" style="color: var(--receipt)">Preferred</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
