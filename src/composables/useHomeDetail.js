import { computed, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { saveRecentHome } from '../lib/recentHomes'
import {
  emptyPurchaseOption,
  purchaseOptionsFromItem,
  cleanPurchaseOptions,
  itemEstimate,
} from '../lib/purchaseOptions'

function createEmptyItemForm() {
  return {
    name: '',
    type: 'furniture',
    room_id: '',
    estimated_price: '',
    priority: 'medium',
    status: 'planned',
    purchase_options: [emptyPurchaseOption()],
    notes: '',
  }
}

export function useHomeDetail(homeId) {
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

  const showRoomForm = ref(false)
  const editingRoom = ref(null)
  const roomForm = ref({ name: '', budget: '' })
  const savingRoom = ref(false)
  const deletingRoomId = ref('')

  const showItemForm = ref(false)
  const editingItem = ref(null)
  const itemForm = ref(createEmptyItemForm())
  const itemFilterRoom = ref('')
  const savingItem = ref(false)
  const deletingItemId = ref('')

  const showQuickAdd = ref(false)
  const quickAddItem = ref(null)

  const totalSpent = computed(() => items.value.reduce((sum, item) => sum + itemEstimate(item), 0))
  const totalBudget = computed(() => Number(home.value?.total_budget) || 0)
  const remaining = computed(() => totalBudget.value - totalSpent.value)
  const percentUsed = computed(() => {
    if (!totalBudget.value) return 0
    return Math.min(100, Math.round((totalSpent.value / totalBudget.value) * 100))
  })
  const filteredItems = computed(() => {
    if (!itemFilterRoom.value) return items.value
    return items.value.filter((item) => item.room_id === itemFilterRoom.value)
  })
  const roomsWithStats = computed(() =>
    rooms.value.map((room) => {
      const spent = roomSpent(room.id)
      const budget = Number(room.budget) || 0
      return {
        ...room,
        spent,
        percentUsed: budget ? Math.min(100, Math.round((spent / budget) * 100)) : 0,
      }
    }),
  )

  function clearActionMessages() {
    actionError.value = ''
    actionSuccess.value = ''
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

  async function fetchHome() {
    loading.value = true
    const { data, error: err } = await supabase.from('homes').select().eq('id', homeId).single()
    if (err || !data) {
      loadError.value = err?.message || 'Home not found'
      loading.value = false
      return
    }
    home.value = data
    saveRecentHome(data)
    await fetchRooms()
    await fetchItems()
    loading.value = false
  }

  async function fetchRooms() {
    const { data, error: err } = await supabase.from('rooms').select().eq('home_id', homeId).order('created_at')
    if (err) {
      showActionError(err.message)
      return
    }
    rooms.value = data || []
  }

  async function fetchItems() {
    const roomIds = rooms.value.map((room) => room.id)
    if (roomIds.length === 0) {
      items.value = []
      return
    }
    const { data, error: err } = await supabase
      .from('items')
      .select('*, rooms(id,name)')
      .in('room_id', roomIds)
      .order('created_at')
    if (err) {
      showActionError(err.message)
      return
    }
    items.value = data || []
  }

  function openAddRoom() {
    editingRoom.value = null
    formError.value = ''
    roomForm.value = { name: '', budget: '' }
    showRoomForm.value = true
  }

  function openEditRoom(room) {
    editingRoom.value = room
    formError.value = ''
    roomForm.value = { name: room.name, budget: String(room.budget) }
    showRoomForm.value = true
  }

  function closeRoomForm() {
    if (savingRoom.value) return
    showRoomForm.value = false
  }

  async function saveRoom() {
    if (savingRoom.value) return
    clearActionMessages()
    formError.value = ''
    if (!roomForm.value.name.trim()) {
      formError.value = 'Room name is required.'
      return
    }

    const data = { name: roomForm.value.name.trim(), budget: parseFloat(roomForm.value.budget) || 0, home_id: homeId }
    savingRoom.value = true
    const { error: err } = editingRoom.value
      ? await supabase.from('rooms').update(data).eq('id', editingRoom.value.id)
      : await supabase.from('rooms').insert(data)
    savingRoom.value = false

    if (err) {
      formError.value = err.message
      return
    }
    showRoomForm.value = false
    await fetchRooms()
    showActionSuccess(editingRoom.value ? 'Room updated.' : 'Room added.')
  }

  async function deleteRoom(id) {
    if (deletingRoomId.value) return
    if (!confirm('Delete this room and all its items?')) return
    clearActionMessages()
    deletingRoomId.value = id
    const { error: err } = await supabase.from('rooms').delete().eq('id', id)
    deletingRoomId.value = ''
    if (err) {
      showActionError(err.message)
      return
    }
    await fetchRooms()
    await fetchItems()
    showActionSuccess('Room deleted.')
  }

  function openAddItem() {
    if (rooms.value.length === 0) return
    editingItem.value = null
    formError.value = ''
    itemForm.value = createEmptyItemForm()
    showItemForm.value = true
  }

  function openEditItem(item) {
    editingItem.value = item
    formError.value = ''
    const purchaseOptions = purchaseOptionsFromItem(item)
    itemForm.value = {
      name: item.name,
      type: item.type,
      room_id: item.room_id,
      estimated_price: String(item.estimated_price),
      priority: item.priority,
      status: item.status,
      purchase_options: purchaseOptions.length ? purchaseOptions : [emptyPurchaseOption()],
      notes: item.notes || '',
    }
    showItemForm.value = true
  }

  function closeItemForm() {
    if (savingItem.value) return
    showItemForm.value = false
  }

  async function saveItem() {
    if (savingItem.value) return
    clearActionMessages()
    formError.value = ''
    if (!itemForm.value.name.trim()) {
      formError.value = 'Item name is required.'
      return
    }
    if (!itemForm.value.room_id) {
      formError.value = 'Select a room before saving the item.'
      return
    }

    const data = {
      name: itemForm.value.name.trim(),
      type: itemForm.value.type,
      room_id: itemForm.value.room_id,
      estimated_price: parseFloat(itemForm.value.estimated_price) || 0,
      priority: itemForm.value.priority,
      status: itemForm.value.status,
      vendor_links: cleanPurchaseOptions(itemForm.value.purchase_options),
      notes: itemForm.value.notes,
    }

    savingItem.value = true
    const { error: err } = editingItem.value
      ? await supabase.from('items').update(data).eq('id', editingItem.value.id)
      : await supabase.from('items').insert(data)
    savingItem.value = false

    if (err) {
      formError.value = err.message
      return
    }
    showItemForm.value = false
    await fetchItems()
    showActionSuccess(editingItem.value ? 'Item updated.' : 'Item added.')
  }

  async function deleteItem(item) {
    if (deletingItemId.value) return
    if (!confirm('Delete this item?')) return
    clearActionMessages()
    deletingItemId.value = item.id
    const { error: err } = await supabase.from('items').delete().eq('id', item.id)
    deletingItemId.value = ''
    if (err) {
      showActionError(err.message)
      return
    }
    await fetchItems()
    showActionSuccess('Item deleted.')
  }

  function addPurchaseOption() {
    itemForm.value.purchase_options.push(emptyPurchaseOption())
  }

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

  function openQuickAdd(item) {
    quickAddItem.value = item
    showQuickAdd.value = true
  }

  function closeQuickAdd() {
    showQuickAdd.value = false
  }

  async function saveQuickOption(optionData) {
    if (!quickAddItem.value) return
    const item = quickAddItem.value
    let existing = Array.isArray(item.vendor_links) ? [...item.vendor_links] : []

    if (optionData.selected) {
      existing = existing.map((option) => ({ ...option, selected: false, preferred: false }))
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
    if (err) {
      showActionError(err.message)
      return
    }

    showQuickAdd.value = false
    await fetchItems()
    showActionSuccess('Option added.')
  }

  function roomSpent(roomId) {
    return items.value.filter((item) => item.room_id === roomId).reduce((sum, item) => sum + itemEstimate(item), 0)
  }

  async function copyLink() {
    clearActionMessages()
    try {
      await navigator.clipboard.writeText(window.location.href)
      showActionSuccess('Home link copied.')
    } catch (e) {
      showActionError('Could not copy the link. Copy it from the address bar.')
    }
  }

  return {
    home,
    rooms,
    items,
    activeTab,
    loading,
    loadError,
    actionError,
    actionSuccess,
    formError,
    showRoomForm,
    editingRoom,
    roomForm,
    savingRoom,
    deletingRoomId,
    showItemForm,
    editingItem,
    itemForm,
    itemFilterRoom,
    savingItem,
    showQuickAdd,
    totalSpent,
    totalBudget,
    remaining,
    percentUsed,
    filteredItems,
    roomsWithStats,
    fetchHome,
    openAddRoom,
    openEditRoom,
    closeRoomForm,
    saveRoom,
    deleteRoom,
    openAddItem,
    openEditItem,
    closeItemForm,
    saveItem,
    deleteItem,
    addPurchaseOption,
    removePurchaseOption,
    moveOptionUp,
    moveOptionDown,
    selectPurchaseOption,
    openQuickAdd,
    closeQuickAdd,
    saveQuickOption,
    copyLink,
  }
}
