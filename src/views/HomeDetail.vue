<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { saveRecentHome } from '../lib/recentHomes'

const route = useRoute()
const router = useRouter()
const homeId = route.params.id
const home = ref(null)
const rooms = ref([])
const items = ref([])
const activeTab = ref('rooms')
const loading = ref(true)
const loadError = ref('')
const actionError = ref('')
const actionSuccess = ref('')
const formError = ref('')
const successTimeout = ref(null)
const errorTimeout = ref(null)

// ---------- fetch data ----------
async function fetchHome() {
  const { data, error: err } = await supabase.from('homes').select().eq('id', homeId).single()
  if (err || !data) { loadError.value = err?.message || 'Home not found'; loading.value = false; return }
  home.value = data
  saveRecentHome(data)
  await fetchRooms()
  await fetchItems()
}

function showActionSuccess(message) {
  actionError.value = ''
  actionSuccess.value = message
  if (successTimeout.value) clearTimeout(successTimeout.value)
  successTimeout.value = setTimeout(() => {
    actionSuccess.value = ''
  }, 3000)
}

function showActionError(message) {
  actionSuccess.value = ''
  actionError.value = message
  if (errorTimeout.value) clearTimeout(errorTimeout.value)
  errorTimeout.value = setTimeout(() => {
    actionError.value = ''
  }, 5000)
}

async function fetchRooms() {
  const { data, error: err } = await supabase.from('rooms').select().eq('home_id', homeId).order('created_at')
  if (err) { showActionError(err.message); loading.value = false; return }
  rooms.value = data || []
  loading.value = false
}

async function fetchItems() {
  const roomIds = rooms.value.map(r => r.id)
  if (roomIds.length === 0) { items.value = []; return }

  const { data, error: err } = await supabase.from('items').select('*, rooms(id,name)').in('room_id', roomIds).order('created_at')
  if (err) { showActionError(err.message); return }
  items.value = data || []
}

// ---------- room CRUD ----------
const showRoomForm = ref(false)
const editingRoom = ref(null)
const roomForm = ref({ name: '', budget: '' })
const roomNameInput = ref(null)
const savingRoom = ref(false)
const deletingRoomId = ref('')

async function focusRoomNameInput() {
  await nextTick()
  roomNameInput.value?.focus()
}

function openAddRoom() { editingRoom.value = null; formError.value = ''; roomForm.value = { name: '', budget: '' }; showRoomForm.value = true; focusRoomNameInput() }
function openEditRoom(room) { editingRoom.value = room; formError.value = ''; roomForm.value = { name: room.name, budget: String(room.budget) }; showRoomForm.value = true; focusRoomNameInput() }

async function saveRoom() {
  if (savingRoom.value) return
  actionError.value = ''
  actionSuccess.value = ''
  formError.value = ''
  if (!roomForm.value.name.trim()) { formError.value = 'Room name is required.'; return }
  const data = { name: roomForm.value.name.trim(), budget: parseFloat(roomForm.value.budget) || 0, home_id: homeId }
  let err

  savingRoom.value = true
  if (editingRoom.value) {
    ;({ error: err } = await supabase.from('rooms').update(data).eq('id', editingRoom.value.id))
  } else {
    ;({ error: err } = await supabase.from('rooms').insert(data))
  }
  savingRoom.value = false
  if (err) { formError.value = err.message; return }

  showRoomForm.value = false
  await fetchRooms()
  showActionSuccess(editingRoom.value ? 'Room updated.' : 'Room added.')
}

async function deleteRoom(id) {
  if (deletingRoomId.value) return
  if (!confirm('Delete this room and all its items?')) return
  actionError.value = ''
  actionSuccess.value = ''
  deletingRoomId.value = id
  const { error: err } = await supabase.from('rooms').delete().eq('id', id)
  deletingRoomId.value = ''
  if (err) { showActionError(err.message); return }
  await fetchRooms()
  await fetchItems()
  showActionSuccess('Room deleted.')
}

// ---------- item CRUD ----------
const showItemForm = ref(false)
const editingItem = ref(null)
const itemForm = ref({
  name: '',
  type: 'furniture',
  room_id: '',
  estimated_price: '',
  priority: 'medium',
  status: 'planned',
  purchase_options: [],
  notes: '',
})
const itemFilterRoom = ref('')
const itemNameInput = ref(null)
const savingItem = ref(false)
const deletingItemId = ref('')
const expandedNoteIds = ref(new Set())

const filteredItems = computed(() => {
  if (!itemFilterRoom.value) return items.value
  return items.value.filter(i => i.room_id === itemFilterRoom.value)
})

function emptyPurchaseOption() {
  return { label: '', store: '', price: '', url: '', notes: '', selected: false }
}

function openAddItem() {
  if (rooms.value.length === 0) return
  editingItem.value = null
  formError.value = ''
  itemForm.value = {
    name: '',
    type: 'furniture',
    room_id: '',
    estimated_price: '',
    priority: 'medium',
    status: 'planned',
    purchase_options: [emptyPurchaseOption()],
    notes: '',
  }
  showItemForm.value = true
  focusItemNameInput()
}
function openEditItem(item) {
  editingItem.value = item
  formError.value = ''
  itemForm.value = {
    name: item.name, type: item.type, room_id: item.room_id,
    estimated_price: String(item.estimated_price), priority: item.priority,
    status: item.status, purchase_options: purchaseOptions(item), notes: item.notes || ''
  }
  if (itemForm.value.purchase_options.length === 0) itemForm.value.purchase_options.push(emptyPurchaseOption())
  showItemForm.value = true
  focusItemNameInput()
}

async function focusItemNameInput() {
  await nextTick()
  itemNameInput.value?.focus()
}

async function saveItem() {
  if (savingItem.value) return
  actionError.value = ''
  actionSuccess.value = ''
  formError.value = ''
  if (!itemForm.value.name.trim()) { formError.value = 'Item name is required.'; return }
  if (!itemForm.value.room_id) { formError.value = 'Select a room before saving the item.'; return }
  const purchaseOptions = cleanPurchaseOptions(itemForm.value.purchase_options)

  const data = {
    name: itemForm.value.name.trim(),
    type: itemForm.value.type,
    room_id: itemForm.value.room_id,
    estimated_price: parseFloat(itemForm.value.estimated_price) || 0,
    priority: itemForm.value.priority,
    status: itemForm.value.status,
    vendor_links: purchaseOptions,
    notes: itemForm.value.notes,
  }

  let err
  savingItem.value = true
  if (editingItem.value) {
    ;({ error: err } = await supabase.from('items').update(data).eq('id', editingItem.value.id))
  } else {
    ;({ error: err } = await supabase.from('items').insert(data))
  }
  savingItem.value = false
  if (err) { formError.value = err.message; return }

  showItemForm.value = false
  await fetchItems()
  showActionSuccess(editingItem.value ? 'Item updated.' : 'Item added.')
}

async function deleteItem(id) {
  if (deletingItemId.value) return
  if (!confirm('Delete this item?')) return
  actionError.value = ''
  actionSuccess.value = ''
  deletingItemId.value = id
  const { error: err } = await supabase.from('items').delete().eq('id', id)
  deletingItemId.value = ''
  if (err) { showActionError(err.message); return }
  await fetchItems()
  showActionSuccess('Item deleted.')
}

function getRoomName(roomId) {
  return rooms.value.find(r => r.id === roomId)?.name || 'Unknown'
}

// ---------- budget ----------
const totalSpent = computed(() => items.value.reduce((sum, i) => sum + itemEstimate(i), 0))
const totalBudget = computed(() => Number(home.value?.total_budget) || 0)
const remaining = computed(() => totalBudget.value - totalSpent.value)

function roomSpent(roomId) {
  return items.value.filter(i => i.room_id === roomId).reduce((sum, i) => sum + itemEstimate(i), 0)
}

function roomBudget(roomId) {
  return Number(rooms.value.find(r => r.id === roomId)?.budget) || 0
}

function roomItemCount(roomId) {
  return items.value.filter(i => i.room_id === roomId).length
}

function percent(spent, budget) {
  if (!budget) return 0
  return Math.min(100, Math.round((spent / budget) * 100))
}

// ---------- lifecycle ----------
onMounted(fetchHome)

// ---------- helpers ----------
const priorityColors = { high: 'text-red-400', medium: 'text-yellow-400', low: 'text-green-400' }
const statusColors = { planned: 'bg-gray-700 text-gray-300', researching: 'bg-blue-900 text-blue-300', bought: 'bg-green-900 text-green-300' }
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0)
}

function parseMoneyValue(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string' && /[R$\s,.]/.test(value)) {
    const digits = value.replace(/\D/g, '')
    if (!digits) return 0
    return Number(digits) / 100
  }
  const normalizedValue = typeof value === 'string' ? value.replace(',', '.') : value
  const numberValue = Number(normalizedValue)
  return Number.isFinite(numberValue) ? numberValue : null
}

function formatCurrencyInput(value) {
  return formatCurrency(parseMoneyValue(value) || 0)
}

function focusCurrencyInput(option) {
  if (option.price === '' || option.price === null || option.price === undefined) {
    option.price = formatCurrency(0)
  } else {
    option.price = formatCurrencyInput(option.price)
  }
}

function updateCurrencyInput(option, event) {
  const digits = event.target.value.replace(/\D/g, '')
  const amount = digits ? Number(digits) / 100 : 0
  option.price = formatCurrency(amount)
}

function normalizePurchaseOption(option, index = 0) {
  if (typeof option === 'string') {
    return {
      label: '',
      store: '',
      price: '',
      url: option,
      notes: '',
      selected: false,
    }
  }

  const price = parseMoneyValue(option?.price ?? option?.estimated_price)

  return {
    label: option?.label || option?.name || option?.model || '',
    store: option?.store || '',
    price: price === null ? '' : formatCurrency(price),
    url: option?.url || '',
    notes: option?.notes || '',
    selected: Boolean(option?.selected || option?.preferred),
  }
}

function purchaseOptions(item) {
  if (!Array.isArray(item?.vendor_links)) return []
  return item.vendor_links.map((option, index) => normalizePurchaseOption(option, index))
}

function optionHasContent(option) {
  return Boolean(
    option.label?.trim() ||
    option.store?.trim() ||
    option.url?.trim() ||
    option.notes?.trim() ||
    (parseMoneyValue(option.price) || 0) > 0
  )
}

function cleanPurchaseOptions(options) {
  let selectedAlreadyUsed = false

  return (options || [])
    .filter(optionHasContent)
    .map(option => {
      const isSelected = Boolean(option.selected) && !selectedAlreadyUsed
      if (isSelected) selectedAlreadyUsed = true

      return {
        label: option.label?.trim() || '',
        store: option.store?.trim() || '',
        price: parseMoneyValue(option.price),
        url: option.url?.trim() || '',
        notes: option.notes?.trim() || '',
        selected: isSelected,
      }
    })
}

function optionPrice(option) {
  return parseMoneyValue(option?.price) || 0
}

function selectedOption(item) {
  return purchaseOptions(item).find(option => option.selected && optionPrice(option) > 0)
}

function lowestOption(item) {
  return purchaseOptions(item)
    .filter(option => optionPrice(option) > 0)
    .sort((a, b) => optionPrice(a) - optionPrice(b))[0]
}

function itemEstimate(item) {
  const selectedPrice = optionPrice(selectedOption(item))
  return selectedPrice || Number(item.estimated_price) || 0
}

function hasOptionEstimate(item) {
  return Boolean(selectedOption(item))
}

function addPurchaseOption() {
  itemForm.value.purchase_options.push(emptyPurchaseOption())
}

function removePurchaseOption(index) {
  itemForm.value.purchase_options.splice(index, 1)
  if (itemForm.value.purchase_options.length === 0) itemForm.value.purchase_options.push(emptyPurchaseOption())
}

function selectPurchaseOption(index) {
  itemForm.value.purchase_options = itemForm.value.purchase_options.map((option, optionIndex) => ({
    ...option,
    selected: optionIndex === index,
  }))
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

async function copyLink() {
  actionError.value = ''
  actionSuccess.value = ''
  try {
    await navigator.clipboard.writeText(window.location.href)
    showActionSuccess('Home link copied.')
  } catch (e) {
    showActionError('Could not copy the link. Copy it from the address bar.')
  }
}
</script>

<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  <div v-else-if="loadError" class="min-h-screen flex flex-col items-center justify-center gap-4">
    <p class="text-red-400 text-lg">{{ loadError }}</p>
    <button @click="router.push('/')" class="text-indigo-400 hover:text-indigo-300 underline">Back to home</button>
  </div>

  <div v-else class="max-w-5xl mx-auto p-4 pb-20 space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-white">{{ home.name }}</h1>
        <p class="text-sm text-gray-500">ID: {{ home.id }}</p>
      </div>
      <div class="flex gap-2">
        <button @click="router.push('/')" class="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
          Home
        </button>
        <button @click="copyLink" class="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
          Copy Link
        </button>
      </div>
    </div>

    <div v-if="actionSuccess" class="bg-green-950/50 border border-green-900 text-green-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
      <p class="text-sm">{{ actionSuccess }}</p>
      <button @click="actionSuccess = ''" class="text-xs text-green-300 hover:text-green-100 transition-colors">Dismiss</button>
    </div>

    <div v-if="actionError" class="bg-red-950/60 border border-red-900 text-red-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
      <p class="text-sm">{{ actionError }}</p>
      <button @click="actionError = ''" class="text-xs text-red-300 hover:text-red-100 transition-colors">Dismiss</button>
    </div>

    <!-- Budget quick bar -->
    <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div class="flex justify-between text-sm text-gray-400 mb-1">
        <span>Total: {{ formatCurrency(totalBudget) }}</span>
        <span>Remaining: <span :class="remaining < 0 ? 'text-red-400' : 'text-green-400'">{{ formatCurrency(remaining) }}</span></span>
      </div>
      <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all" :class="remaining < 0 ? 'bg-red-500' : 'bg-indigo-500'" :style="{ width: percent(totalSpent, totalBudget) + '%' }"></div>
      </div>
      <p class="text-xs text-gray-500 mt-1">{{ percent(totalSpent, totalBudget) }}% of budget used</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
      <button
        v-for="tab in ['rooms', 'items', 'budget']" :key="tab"
        @click="activeTab = tab"
        :class="activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'"
        class="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
      >{{ tab }}</button>
    </div>

    <!-- ROOMS TAB -->
    <div v-if="activeTab === 'rooms'" class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold text-white">Rooms ({{ rooms.length }})</h2>
        <button @click="openAddRoom" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">+ Add Room</button>
      </div>
      <div v-if="rooms.length === 0" class="text-gray-500 text-center py-12">No rooms yet. Add one to get started.</div>
      <div v-for="room in rooms" :key="room.id" class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p class="text-white font-medium">{{ room.name }}</p>
          <p class="text-sm text-gray-400">Budget: {{ formatCurrency(room.budget) }}</p>
          <div class="flex items-center gap-2 mt-1">
            <div class="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-500 rounded-full" :style="{ width: percent(roomSpent(room.id), room.budget) + '%' }"></div>
            </div>
            <span class="text-xs text-gray-500">{{ percent(roomSpent(room.id), room.budget) }}%</span>
          </div>
        </div>
        <div class="flex gap-1">
          <button @click="openEditRoom(room)" class="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors">Edit</button>
          <button
            @click="deleteRoom(room.id)"
            :disabled="Boolean(deletingRoomId)"
            class="px-2 py-1 text-xs bg-red-900 hover:bg-red-800 disabled:bg-gray-800 disabled:text-gray-500 text-red-300 rounded transition-colors"
          >{{ deletingRoomId === room.id ? 'Deleting...' : 'Del' }}</button>
        </div>
      </div>
    </div>

    <!-- ITEMS TAB -->
    <div v-if="activeTab === 'items'" class="space-y-4">
      <div class="flex flex-wrap justify-between items-center gap-3">
        <h2 class="text-lg font-semibold text-white">Items ({{ filteredItems.length }})</h2>
        <div class="flex gap-2">
          <select v-model="itemFilterRoom" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="">All Rooms</option>
            <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
          </select>
          <button
            @click="openAddItem"
            :disabled="rooms.length === 0"
            class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-lg transition-colors"
          >+ Add Item</button>
        </div>
      </div>
      <div v-if="filteredItems.length === 0" class="text-gray-500 text-center py-12">No items yet. Add one to get started.</div>
      <div v-for="item in filteredItems" :key="item.id" class="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
        <div class="flex justify-between items-start gap-3">
          <div>
            <p class="text-white font-medium">{{ item.name }}</p>
            <p class="text-xs text-gray-500">{{ getRoomName(item.room_id) }} &middot; {{ item.type }}</p>
          </div>
          <div class="flex gap-1 shrink-0">
            <button @click="openEditItem(item)" class="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors">Edit</button>
            <button
              @click="deleteItem(item.id)"
              :disabled="Boolean(deletingItemId)"
              class="px-2 py-1 text-xs bg-red-900 hover:bg-red-800 disabled:bg-gray-800 disabled:text-gray-500 text-red-300 rounded transition-colors"
            >{{ deletingItemId === item.id ? 'Deleting...' : 'Del' }}</button>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-sm text-indigo-300 font-medium">{{ formatCurrency(itemEstimate(item)) }}</span>
          <span class="text-xs text-gray-500">{{ hasOptionEstimate(item) ? 'Preferred option' : 'Manual estimate' }}</span>
          <span v-if="lowestOption(item)" class="text-xs text-gray-500">Lowest: {{ formatCurrency(optionPrice(lowestOption(item))) }}</span>
          <span :class="priorityColors[item.priority]" class="text-xs capitalize">{{ item.priority }} priority</span>
          <span :class="statusColors[item.status]" class="text-xs px-2 py-0.5 rounded-full capitalize">{{ item.status }}</span>
        </div>
        <div v-if="item.notes" class="space-y-1">
          <p class="text-sm text-gray-400 whitespace-pre-line break-words max-h-32 overflow-y-auto">{{ noteText(item) }}</p>
          <button
            v-if="shouldCollapseNote(item.notes)"
            @click="toggleNote(item.id)"
            class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >{{ isNoteExpanded(item.id) ? 'Show less' : 'Show more' }}</button>
        </div>
        <div v-if="purchaseOptions(item).length" class="space-y-2">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Purchase options</p>
          <div class="divide-y divide-gray-800 overflow-hidden rounded-lg border border-gray-800">
            <div
              v-for="(option, i) in purchaseOptions(item)" :key="i"
              class="flex flex-wrap items-start gap-3 px-3 py-2"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-200">{{ option.label || vendorLabel(option, i) }}</p>
                <p class="text-xs text-gray-500">
                  <span v-if="option.store">{{ option.store }}</span>
                  <span v-if="option.store && vendorHref(option)"> &middot; </span>
                  <a
                    v-if="vendorHref(option)"
                    :href="vendorHref(option)" target="_blank" rel="noopener"
                    class="text-indigo-400 hover:text-indigo-300 underline"
                    :title="vendorHref(option)"
                  >Open link</a>
                </p>
                <p v-if="option.notes" class="mt-1 text-xs text-gray-500 whitespace-pre-line break-words">{{ option.notes }}</p>
              </div>
              <div class="text-right">
                <p v-if="optionPrice(option)" class="text-sm font-medium text-gray-200">{{ formatCurrency(optionPrice(option)) }}</p>
                <p v-if="option.selected" class="text-xs text-green-400">Preferred</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- BUDGET TAB -->
    <div v-if="activeTab === 'budget'" class="space-y-6">
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

    <!-- MODALS -->
    <!-- Room Form Modal -->
    <div v-if="showRoomForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="!savingRoom && (showRoomForm = false)">
      <form @submit.prevent="saveRoom" class="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm space-y-4">
        <h3 class="text-lg font-semibold text-white">{{ editingRoom ? 'Edit Room' : 'Add Room' }}</h3>
        <input ref="roomNameInput" v-model="roomForm.name" :disabled="savingRoom" placeholder="Room name" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500" />
        <input v-model="roomForm.budget" :disabled="savingRoom" type="number" step="0.01" placeholder="Budget" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500" />
        <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
        <div class="flex gap-2">
          <button type="submit" :disabled="savingRoom" class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 rounded-lg transition-colors">{{ savingRoom ? 'Saving...' : 'Save' }}</button>
          <button type="button" :disabled="savingRoom" @click="showRoomForm = false" class="flex-1 bg-gray-800 hover:bg-gray-700 disabled:text-gray-500 text-gray-300 py-2 rounded-lg transition-colors">Cancel</button>
        </div>
      </form>
    </div>

    <!-- Item Form Modal -->
    <div v-if="showItemForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto" @click.self="!savingItem && (showItemForm = false)">
      <form @submit.prevent="saveItem" class="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-xl space-y-3 my-8">
        <h3 class="text-lg font-semibold text-white">{{ editingItem ? 'Edit Item' : 'Add Item' }}</h3>
        <input ref="itemNameInput" v-model="itemForm.name" :disabled="savingItem" placeholder="Item name" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500" />
        <select v-model="itemForm.room_id" :disabled="savingItem" required class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white disabled:opacity-60 focus:outline-none focus:border-indigo-500">
          <option value="" disabled>Select a room</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
        </select>
        <div class="grid gap-2 sm:grid-cols-2">
          <select v-model="itemForm.type" :disabled="savingItem" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-60 focus:outline-none focus:border-indigo-500">
            <option value="furniture">Furniture</option>
            <option value="appliance">Appliance</option>
            <option value="decoration">Decoration</option>
            <option value="other">Other</option>
          </select>
          <input v-model="itemForm.estimated_price" :disabled="savingItem" type="number" step="0.01" placeholder="Manual estimate" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500" />
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <select v-model="itemForm.priority" :disabled="savingItem" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-60 focus:outline-none focus:border-indigo-500">
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <select v-model="itemForm.status" :disabled="savingItem" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-60 focus:outline-none focus:border-indigo-500">
            <option value="planned">Planned</option>
            <option value="researching">Researching</option>
            <option value="bought">Bought</option>
          </select>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-3">
            <h4 class="text-sm font-medium text-gray-300">Purchase options</h4>
            <button
              type="button"
              :disabled="savingItem"
              @click="addPurchaseOption"
              class="shrink-0 rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700 disabled:text-gray-500"
            >+ Add Option</button>
          </div>

          <div
            v-for="(option, index) in itemForm.purchase_options" :key="index"
            class="space-y-2 rounded-lg border border-gray-800 p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <label class="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="radio"
                  name="preferred-option"
                  :checked="option.selected"
                  :disabled="savingItem"
                  @change="selectPurchaseOption(index)"
                  class="accent-indigo-500"
                />
                Preferred
              </label>
              <button
                type="button"
                :disabled="savingItem"
                @click="removePurchaseOption(index)"
                class="text-xs text-red-300 transition-colors hover:text-red-200 disabled:text-gray-500"
              >Remove</button>
            </div>
            <input v-model="option.label" :disabled="savingItem" placeholder="Model or name" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500" />
            <div class="grid gap-2 sm:grid-cols-2">
              <input v-model="option.store" :disabled="savingItem" placeholder="Store" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500" />
              <input
                :value="option.price"
                :disabled="savingItem"
                type="text"
                inputmode="numeric"
                placeholder="R$ 0,00"
                @focus="focusCurrencyInput(option)"
                @input="updateCurrencyInput(option, $event)"
                class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <input v-model="option.url" :disabled="savingItem" type="url" placeholder="URL" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500" />
            <textarea v-model="option.notes" :disabled="savingItem" placeholder="Option notes" rows="2" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"></textarea>
          </div>
        </div>
        <textarea v-model="itemForm.notes" :disabled="savingItem" placeholder="Notes (dimensions, color, etc.)" rows="2" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"></textarea>
        <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
        <div class="flex gap-2">
          <button type="submit" :disabled="savingItem" class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 rounded-lg transition-colors">{{ savingItem ? 'Saving...' : 'Save' }}</button>
          <button type="button" :disabled="savingItem" @click="showItemForm = false" class="flex-1 bg-gray-800 hover:bg-gray-700 disabled:text-gray-500 text-gray-300 py-2 rounded-lg transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>
