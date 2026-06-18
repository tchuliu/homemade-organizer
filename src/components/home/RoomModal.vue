<script setup>
import { nextTick, useTemplateRef, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  editingRoom: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  formError: { type: String, default: '' },
})

const roomForm = defineModel('roomForm', { type: Object, required: true })
const emit = defineEmits(['close', 'save'])
const roomNameInput = useTemplateRef('roomNameInput')

watch(
  () => props.show,
  async (visible) => {
    if (!visible) return
    await nextTick()
    roomNameInput.value?.focus()
  },
)
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    @click.self="!saving && emit('close')"
  >
    <form
      @submit.prevent="emit('save')"
      class="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm space-y-4"
    >
      <h3 class="text-lg font-semibold text-white">{{ editingRoom ? 'Edit Room' : 'Add Room' }}</h3>
      <input
        ref="roomNameInput"
        v-model="roomForm.name"
        :disabled="saving"
        placeholder="Room name"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
      />
      <input
        v-model="roomForm.budget"
        :disabled="saving"
        type="number"
        step="0.01"
        placeholder="Budget"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
      />
      <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
      <div class="flex gap-2">
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <button
          type="button"
          :disabled="saving"
          @click="emit('close')"
          class="flex-1 bg-gray-800 hover:bg-gray-700 disabled:text-gray-500 text-gray-300 py-2 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>
