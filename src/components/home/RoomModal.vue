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
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    @click.self="!saving && emit('close')"
  >
    <form @submit.prevent="emit('save')" class="panel w-full max-w-sm space-y-4">
      <h3 class="section-title">{{ editingRoom ? 'Edit Room' : 'Add Room' }}</h3>
      <input
        ref="roomNameInput"
        v-model="roomForm.name"
        :disabled="saving"
        placeholder="Room name"
        class="field disabled:opacity-60"
      />
      <input
        v-model="roomForm.budget"
        :disabled="saving"
        type="number"
        step="0.01"
        placeholder="Budget"
        class="field disabled:opacity-60"
      />
      <p v-if="formError" class="text-sm" style="color: var(--overrun)">{{ formError }}</p>
      <div class="flex gap-2">
        <button type="submit" :disabled="saving" class="btn-primary flex-1 py-2.5">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <button type="button" :disabled="saving" @click="emit('close')" class="btn-secondary flex-1 py-2.5">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>
