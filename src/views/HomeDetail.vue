<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHomeDetail } from '../composables/useHomeDetail'
import BudgetBar from '../components/BudgetBar.vue'
import BudgetTab from '../components/BudgetTab.vue'
import ItemModal from '../components/ItemModal.vue'
import QuickAddOption from '../components/QuickAddOption.vue'
import HomeHeader from '../components/home/HomeHeader.vue'
import HomeTabs from '../components/home/HomeTabs.vue'
import ItemsTab from '../components/home/ItemsTab.vue'
import RoomModal from '../components/home/RoomModal.vue'
import RoomsTab from '../components/home/RoomsTab.vue'
import StatusMessage from '../components/home/StatusMessage.vue'

const route = useRoute()
const router = useRouter()
const homeId = route.params.id

const {
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
} = useHomeDetail(homeId)

onMounted(fetchHome)
</script>

<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  <div v-else-if="loadError" class="min-h-screen flex flex-col items-center justify-center gap-4">
    <p class="text-red-400 text-lg">{{ loadError }}</p>
    <button @click="router.push('/')" class="text-indigo-400 hover:text-indigo-300 underline">Back to home</button>
  </div>

  <div v-else class="max-w-5xl mx-auto p-4 pb-20 space-y-6">
    <HomeHeader :home="home" @back="router.push('/')" @copy-link="copyLink" />

    <StatusMessage :message="actionSuccess" @dismiss="actionSuccess = ''" />
    <StatusMessage type="error" :message="actionError" @dismiss="actionError = ''" />

    <BudgetBar
      :total-budget="totalBudget"
      :total-spent="totalSpent"
      :remaining="remaining"
      :percent-used="percentUsed"
    />

    <HomeTabs v-model="activeTab" />

    <RoomsTab
      v-if="activeTab === 'rooms'"
      :rooms="roomsWithStats"
      :deleting-room-id="deletingRoomId"
      @add="openAddRoom"
      @edit="openEditRoom"
      @delete="deleteRoom"
    />

    <ItemsTab
      v-if="activeTab === 'items'"
      v-model:item-filter-room="itemFilterRoom"
      :items="filteredItems"
      :rooms="rooms"
      @add="openAddItem"
      @edit="openEditItem"
      @delete="deleteItem"
      @quick-add="openQuickAdd"
    />

    <BudgetTab v-if="activeTab === 'budget'" :total-budget="totalBudget" :rooms="rooms" :items="items" />

    <RoomModal
      v-model:room-form="roomForm"
      :show="showRoomForm"
      :editing-room="editingRoom"
      :saving="savingRoom"
      :form-error="formError"
      @close="closeRoomForm"
      @save="saveRoom"
    />

    <ItemModal
      v-model:item-form="itemForm"
      :show="showItemForm"
      :rooms="rooms"
      :editing-item="editingItem"
      :saving="savingItem"
      :form-error="formError"
      @close="closeItemForm"
      @save="saveItem"
      @add-option="addPurchaseOption"
      @remove-option="removePurchaseOption"
      @move-up="moveOptionUp"
      @move-down="moveOptionDown"
      @select-option="selectPurchaseOption"
    />

    <QuickAddOption :show="showQuickAdd" @close="closeQuickAdd" @save="saveQuickOption" />
  </div>
</template>
