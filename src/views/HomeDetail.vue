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
const formError = ref('')

// ---------- fetch data ----------
async function fetchHome() {
  const { data, error: err } = await supabase.from('homes').select().eq('id', homeId).single()
  if (err || !data) { loadError.value = err?.message || 'Home not found'; loading.value = false; return }
  home.value = data
  saveRecentHome(data)
  await fetchRooms()
  await fetchItems()
}

async function fetchRooms() {
  const { data, error: err } = await supabase.from('rooms').select().eq('home_id', homeId).order('created_at')
  if (err) { actionError.value = err.message; loading.value = false; return }
  rooms.value = data || []
  loading.value = false
}

async function fetchItems() {
  const roomIds = rooms.value.map(r => r.id)
  if (roomIds.length === 0) { items.value = []; return }

  const { data, error: err } = await supabase.from('items').select('*, rooms(id,name)').in('room_id', roomIds).order('created_at')
  if (err) { actionError.value = err.message; return }
  items.value = data || []
}

// ---------- room CRUD ----------
const showRoomForm = ref(false)
const editingRoom = ref(null)
const roomForm = ref({ name: '', budget: '' })
const roomNameInput = ref(null)

async function focusRoomNameInput() {
  await nextTick()
  roomNameInput.value?.focus()
}

function openAddRoom() { editingRoom.value = null; formError.value = ''; roomForm.value = { name: '', budget: '' }; showRoomForm.value = true; focusRoomNameInput() }
function openEditRoom(room) { editingRoom.value = room; formError.value = ''; roomForm.value = { name: room.name, budget: String(room.budget) }; showRoomForm.value = true; focusRoomNameInput() }

async function saveRoom() {
  actionError.value = ''
  formError.value = ''
  if (!roomForm.value.name.trim()) { formError.value = 'Room name is required.'; return }
  const data = { name: roomForm.value.name.trim(), budget: parseFloat(roomForm.value.budget) || 0, home_id: homeId }
  let err

  if (editingRoom.value) {
    ;({ error: err } = await supabase.from('rooms').update(data).eq('id', editingRoom.value.id))
  } else {
    ;({ error: err } = await supabase.from('rooms').insert(data))
  }
  if (err) { formError.value = err.message; return }

  showRoomForm.value = false
  fetchRooms()
}

async function deleteRoom(id) {
  if (!confirm('Delete this room and all its items?')) return
  actionError.value = ''
  const { error: err } = await supabase.from('rooms').delete().eq('id', id)
  if (err) { actionError.value = err.message; return }
  fetchRooms()
  fetchItems()
}

// ---------- item CRUD ----------
const showItemForm = ref(false)
const editingItem = ref(null)
const itemForm = ref({ name: '', type: 'furniture', room_id: '', estimated_price: '', priority: 'medium', status: 'planned', vendor_links: '', notes: '' })
const itemFilterRoom = ref('')
const itemNameInput = ref(null)

const filteredItems = computed(() => {
  if (!itemFilterRoom.value) return items.value
  return items.value.filter(i => i.room_id === itemFilterRoom.value)
})

function openAddItem() {
  if (rooms.value.length === 0) return
  editingItem.value = null
  formError.value = ''
  itemForm.value = { name: '', type: 'furniture', room_id: '', estimated_price: '', priority: 'medium', status: 'planned', vendor_links: '', notes: '' }
  showItemForm.value = true
  focusItemNameInput()
}
function openEditItem(item) {
  editingItem.value = item
  formError.value = ''
  itemForm.value = {
    name: item.name, type: item.type, room_id: item.room_id,
    estimated_price: String(item.estimated_price), priority: item.priority,
    status: item.status, vendor_links: JSON.stringify(item.vendor_links || []), notes: item.notes || ''
  }
  showItemForm.value = true
  focusItemNameInput()
}

async function focusItemNameInput() {
  await nextTick()
  itemNameInput.value?.focus()
}

async function saveItem() {
  actionError.value = ''
  formError.value = ''
  if (!itemForm.value.name.trim()) { formError.value = 'Item name is required.'; return }
  if (!itemForm.value.room_id) { formError.value = 'Select a room before saving the item.'; return }
  let vendorLinks = []
  try { vendorLinks = JSON.parse(itemForm.value.vendor_links || '[]') } catch (e) { vendorLinks = [] }

  const data = {
    name: itemForm.value.name.trim(),
    type: itemForm.value.type,
    room_id: itemForm.value.room_id,
    estimated_price: parseFloat(itemForm.value.estimated_price) || 0,
    priority: itemForm.value.priority,
    status: itemForm.value.status,
    vendor_links: vendorLinks,
    notes: itemForm.value.notes,
  }

  let err
  if (editingItem.value) {
    ;({ error: err } = await supabase.from('items').update(data).eq('id', editingItem.value.id))
  } else {
    ;({ error: err } = await supabase.from('items').insert(data))
  }
  if (err) { formError.value = err.message; return }

  showItemForm.value = false
  fetchItems()
}

async function deleteItem(id) {
  if (!confirm('Delete this item?')) return
  actionError.value = ''
  const { error: err } = await supabase.from('items').delete().eq('id', id)
  if (err) { actionError.value = err.message; return }
  fetchItems()
}

function getRoomName(roomId) {
  return rooms.value.find(r => r.id === roomId)?.name || 'Unknown'
}

// ---------- budget ----------
const totalSpent = computed(() => items.value.reduce((sum, i) => sum + (Number(i.estimated_price) || 0), 0))
const totalBudget = computed(() => Number(home.value?.total_budget) || 0)
const remaining = computed(() => totalBudget.value - totalSpent.value)

function roomSpent(roomId) {
  return items.value.filter(i => i.room_id === roomId).reduce((sum, i) => sum + (Number(i.estimated_price) || 0), 0)
}

function roomBudget(roomId) {
  return Number(rooms.value.find(r => r.id === roomId)?.budget) || 0
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

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
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

    <div v-if="actionError" class="bg-red-950/60 border border-red-900 text-red-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
      <p class="text-sm">{{ actionError }}</p>
      <button @click="actionError = ''" class="text-xs text-red-300 hover:text-red-100 transition-colors">Dismiss</button>
    </div>

    <!-- Budget quick bar -->
    <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div class="flex justify-between text-sm text-gray-400 mb-1">
        <span>Total: {{ totalBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}</span>
        <span>Remaining: <span :class="remaining < 0 ? 'text-red-400' : 'text-green-400'">{{ remaining.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}</span></span>
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
          <p class="text-sm text-gray-400">Budget: {{ Number(room.budget).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}</p>
          <div class="flex items-center gap-2 mt-1">
            <div class="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-500 rounded-full" :style="{ width: percent(roomSpent(room.id), room.budget) + '%' }"></div>
            </div>
            <span class="text-xs text-gray-500">{{ percent(roomSpent(room.id), room.budget) }}%</span>
          </div>
        </div>
        <div class="flex gap-1">
          <button @click="openEditRoom(room)" class="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors">Edit</button>
          <button @click="deleteRoom(room.id)" class="px-2 py-1 text-xs bg-red-900 hover:bg-red-800 text-red-300 rounded transition-colors">Del</button>
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
            <button @click="deleteItem(item.id)" class="px-2 py-1 text-xs bg-red-900 hover:bg-red-800 text-red-300 rounded transition-colors">Del</button>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-sm text-indigo-300 font-medium">{{ Number(item.estimated_price).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}</span>
          <span :class="priorityColors[item.priority]" class="text-xs capitalize">{{ item.priority }} priority</span>
          <span :class="statusColors[item.status]" class="text-xs px-2 py-0.5 rounded-full capitalize">{{ item.status }}</span>
        </div>
        <p v-if="item.notes" class="text-sm text-gray-400">{{ item.notes }}</p>
        <div v-if="item.vendor_links && item.vendor_links.length" class="flex flex-wrap gap-1">
          <a
            v-for="(link, i) in item.vendor_links" :key="i"
            :href="link.url || link" target="_blank" rel="noopener"
            class="text-xs text-indigo-400 hover:text-indigo-300 underline"
          >{{ link.label || link.url || link }}</a>
        </div>
      </div>
    </div>

    <!-- BUDGET TAB -->
    <div v-if="activeTab === 'budget'" class="space-y-6">
      <div>
        <h2 class="text-lg font-semibold text-white mb-4">Budget Overview</h2>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p class="text-2xl font-bold text-white">{{ totalBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}</p>
            <p class="text-xs text-gray-500 mt-1">Total Budget</p>
          </div>
          <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p class="text-2xl font-bold text-indigo-400">{{ totalSpent.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}</p>
            <p class="text-xs text-gray-500 mt-1">Planned Cost</p>
          </div>
          <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p class="text-2xl font-bold" :class="remaining < 0 ? 'text-red-400' : 'text-green-400'">{{ remaining.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}</p>
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
              {{ roomSpent(room.id).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
              /
              {{ Number(room.budget).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
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
            {{ items.value.filter(i => i.room_id === room.id).length }} items &middot;
            {{ percent(roomSpent(room.id), room.budget) }}% used
          </p>
        </div>
      </div>
    </div>

    <!-- MODALS -->
    <!-- Room Form Modal -->
    <div v-if="showRoomForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showRoomForm = false">
      <form @submit.prevent="saveRoom" class="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm space-y-4">
        <h3 class="text-lg font-semibold text-white">{{ editingRoom ? 'Edit Room' : 'Add Room' }}</h3>
        <input ref="roomNameInput" v-model="roomForm.name" placeholder="Room name" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        <input v-model="roomForm.budget" type="number" step="0.01" placeholder="Budget" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
        <div class="flex gap-2">
          <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors">Save</button>
          <button type="button" @click="showRoomForm = false" class="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors">Cancel</button>
        </div>
      </form>
    </div>

    <!-- Item Form Modal -->
    <div v-if="showItemForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto" @click.self="showItemForm = false">
      <form @submit.prevent="saveItem" class="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm space-y-3 my-8">
        <h3 class="text-lg font-semibold text-white">{{ editingItem ? 'Edit Item' : 'Add Item' }}</h3>
        <input ref="itemNameInput" v-model="itemForm.name" placeholder="Item name" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        <select v-model="itemForm.room_id" required class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
          <option value="" disabled>Select a room</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
        </select>
        <div class="grid grid-cols-2 gap-2">
          <select v-model="itemForm.type" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="furniture">Furniture</option>
            <option value="appliance">Appliance</option>
            <option value="decoration">Decoration</option>
            <option value="other">Other</option>
          </select>
          <input v-model="itemForm.estimated_price" type="number" step="0.01" placeholder="Price" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <select v-model="itemForm.priority" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <select v-model="itemForm.status" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="planned">Planned</option>
            <option value="researching">Researching</option>
            <option value="bought">Bought</option>
          </select>
        </div>
        <textarea v-model="itemForm.vendor_links" placeholder="Vendor links (JSON array, e.g. [{&quot;label&quot;:&quot;Amazon&quot;,&quot;url&quot;:&quot;https://...&quot;}])" rows="2" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"></textarea>
        <textarea v-model="itemForm.notes" placeholder="Notes (dimensions, color, etc.)" rows="2" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"></textarea>
        <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
        <div class="flex gap-2">
          <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors">Save</button>
          <button type="button" @click="showItemForm = false" class="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>
