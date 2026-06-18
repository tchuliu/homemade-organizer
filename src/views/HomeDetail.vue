<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { saveRecentHome } from '../lib/recentHomes'
import { formatCurrency } from '../lib/currency'
import { emptyPurchaseOption, purchaseOptionsFromItem, cleanPurchaseOptions, itemEstimate } from '../lib/purchaseOptions'
import BudgetBar from '../components/BudgetBar.vue'
import BudgetTab from '../components/BudgetTab.vue'
import ItemList from '../components/ItemList.vue'
import ItemModal from '../components/ItemModal.vue'
import QuickAddOption from '../components/QuickAddOption.vue'

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
  successTimeout.value = setTimeout(() => { actionSuccess.value = '' }, 3000)
}

function showActionError(message) {
  actionSuccess.value = ''
  actionError.value = message
  if (errorTimeout.value) clearTimeout(errorTimeout.value)
  errorTimeout.value = setTimeout(() => { actionError.value = '' }, 5000)
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
  actionError.value = ''; actionSuccess.value = ''; formError.value = ''
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
  actionError.value = ''; actionSuccess.value = ''
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
  name: '', type: 'furniture', room_id: '', estimated_price: '',
  priority: 'medium', status: 'planned', purchase_options: [], notes: '',
})
const itemFilterRoom = ref('')
const savingItem = ref(false)
const deletingItemId = ref('')

const filteredItems = computed(() => {
  if (!itemFilterRoom.value) return items.value
  return items.value.filter(i => i.room_id === itemFilterRoom.value)
})

function openAddItem() {
  if (rooms.value.length === 0) return
  editingItem.value = null
  formError.value = ''
  itemForm.value = {
    name: '', type: 'furniture', room_id: '', estimated_price: '',
    priority: 'medium', status: 'planned', purchase_options: [emptyPurchaseOption()], notes: '',
  }
  showItemForm.value = true
}

function openEditItem(item) {
  editingItem.value = item
  formError.value = ''
  itemForm.value = {
    name: item.name, type: item.type, room_id: item.room_id,
    estimated_price: String(item.estimated_price), priority: item.priority,
    status: item.status, purchase_options: purchaseOptionsFromItem(item), notes: item.notes || ''
  }
  if (itemForm.value.purchase_options.length === 0) itemForm.value.purchase_options.push(emptyPurchaseOption())
  showItemForm.value = true
}

async function saveItem() {
  if (savingItem.value) return
  actionError.value = ''; actionSuccess.value = ''; formError.value = ''
  if (!itemForm.value.name.trim()) { formError.value = 'Item name is required.'; return }
  if (!itemForm.value.room_id) { formError.value = 'Select a room before saving the item.'; return }

  const data = {
    name: itemForm.value.name.trim(), type: itemForm.value.type,
    room_id: itemForm.value.room_id,
    estimated_price: parseFloat(itemForm.value.estimated_price) || 0,
    priority: itemForm.value.priority, status: itemForm.value.status,
    vendor_links: cleanPurchaseOptions(itemForm.value.purchase_options),
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
  actionError.value = ''; actionSuccess.value = ''
  deletingItemId.value = id
  const { error: err } = await supabase.from('items').delete().eq('id', id)
  deletingItemId.value = ''
  if (err) { showActionError(err.message); return }
  await fetchItems()
  showActionSuccess('Item deleted.')
}

// ---------- purchase option mutation handlers ----------
function addPurchaseOption() { itemForm.value.purchase_options.push(emptyPurchaseOption()) }
function removePurchaseOption(index) {
  itemForm.value.purchase_options.splice(index, 1)
  if (itemForm.value.purchase_options.length === 0) itemForm.value.purchase_options.push(emptyPurchaseOption())
}
function moveOptionUp(index) {
  if (index <= 0) return
  const options = itemForm.value.purchase_options
  ;[options[index - 1], options[index]] = [options[index], options[index - 1]]
}
function moveOptionDown(index) {
  const options = itemForm.value.purchase_options
  if (index >= options.length - 1) return
  ;[options[index + 1], options[index]] = [options[index], options[index + 1]]
}
function selectPurchaseOption(index) {
  itemForm.value.purchase_options = itemForm.value.purchase_options.map((option, optionIndex) => ({
    ...option,
    selected: optionIndex === index,
  }))
}

// ---------- quick add option ----------
const showQuickAdd = ref(false)
const quickAddItem = ref(null)

function openQuickAdd(item) {
  quickAddItem.value = item
  showQuickAdd.value = true
}

async function handleQuickSave(optionData) {
  if (!quickAddItem.value) return
  const item = quickAddItem.value
  let existing = Array.isArray(item.vendor_links) ? [...item.vendor_links] : []

  if (optionData.selected) {
    existing = existing.map(o => ({ ...o, selected: false, preferred: false }))
  }

  existing.push({
    label: optionData.label,
    store: optionData.store,
    price: optionData.price,
    url: optionData.url,
    notes: '',
    selected: optionData.selected,
    purchased: optionData.purchased,
  })

  const { error: err } = await supabase.from('items').update({ vendor_links: existing }).eq('id', item.id)
  if (err) { showActionError(err.message); return }

  showQuickAdd.value = false
  await fetchItems()
  showActionSuccess('Option added.')
}

// ---------- budget ----------
const totalSpent = computed(() => items.value.reduce((sum, i) => sum + itemEstimate(i), 0))
const totalBudget = computed(() => Number(home.value?.total_budget) || 0)
const remaining = computed(() => totalBudget.value - totalSpent.value)
const percentUsed = computed(() => {
  if (!totalBudget.value) return 0
  return Math.min(100, Math.round((totalSpent.value / totalBudget.value) * 100))
})

function roomSpent(roomId) {
  return items.value.filter(i => i.room_id === roomId).reduce((sum, i) => sum + itemEstimate(i), 0)
}

function roomPercent(roomId) {
  const budget = Number(rooms.value.find(r => r.id === roomId)?.budget) || 0
  if (!budget) return 0
  return Math.min(100, Math.round((roomSpent(roomId) / budget) * 100))
}

// ---------- lifecycle ----------
onMounted(fetchHome)

// ---------- helpers ----------
async function copyLink() {
  actionError.value = ''; actionSuccess.value = ''
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
        <button @click="router.push('/')" class="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">Home</button>
        <button @click="copyLink" class="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">Copy Link</button>
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
    <BudgetBar :total-budget="totalBudget" :total-spent="totalSpent" :remaining="remaining" :percent-used="percentUsed" />

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
              <div class="h-full bg-indigo-500 rounded-full" :style="{ width: roomPercent(room.id) + '%' }"></div>
            </div>
            <span class="text-xs text-gray-500">{{ roomPercent(room.id) }}%</span>
          </div>
        </div>
        <div class="flex gap-1">
          <button @click="openEditRoom(room)" class="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors">Edit</button>
          <button
            @click="deleteRoom(room.id)" :disabled="Boolean(deletingRoomId)"
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
            @click="openAddItem" :disabled="rooms.length === 0"
            class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-lg transition-colors"
          >+ Add Item</button>
        </div>
      </div>
      <ItemList :items="filteredItems" :rooms="rooms" @edit="openEditItem" @delete="(item) => deleteItem(item.id)" @quick-add="openQuickAdd" />
    </div>

    <!-- BUDGET TAB -->
    <div v-if="activeTab === 'budget'">
      <BudgetTab :total-budget="totalBudget" :rooms="rooms" :items="items" />
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
    <ItemModal
      :show="showItemForm"
      :item-form="itemForm"
      :rooms="rooms"
      :editing-item="editingItem"
      :saving="savingItem"
      :form-error="formError"
      @close="showItemForm = false"
      @save="saveItem"
      @add-option="addPurchaseOption"
      @remove-option="removePurchaseOption"
      @move-up="moveOptionUp"
      @move-down="moveOptionDown"
      @select-option="selectPurchaseOption"
    />

    <!-- Quick Add Option Modal -->
    <QuickAddOption :show="showQuickAdd" @close="showQuickAdd = false" @save="handleQuickSave" />
  </div>
</template>
