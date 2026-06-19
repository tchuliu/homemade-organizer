<script setup>
import { watch, nextTick, useTemplateRef } from 'vue'
import { formatCurrency, formatCurrencyInput } from '../lib/currency'

const props = defineProps({
  show: { type: Boolean, default: false },
  rooms: { type: Array, default: () => [] },
  editingItem: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  formError: { type: String, default: '' },
})

const itemForm = defineModel('itemForm', { type: Object, required: true })
const emit = defineEmits(['close', 'save', 'addOption', 'removeOption', 'moveUp', 'moveDown', 'selectOption'])
const itemNameInput = useTemplateRef('itemNameInput')

watch(
  () => props.show,
  async (visible) => {
    if (visible) {
      await nextTick()
      itemNameInput.value?.focus()
    }
  },
)

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
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-4 sm:overflow-y-auto"
    @click.self="!saving && emit('close')"
  >
    <form
      @submit.prevent="emit('save')"
      class="panel w-full sm:max-w-xl flex flex-col max-sm:fixed max-sm:inset-0 max-sm:rounded-none max-sm:border-0 max-sm:h-[100dvh] sm:my-8"
    >
      <!-- Fixed header -->
      <div class="shrink-0">
        <h3 class="section-title">{{ editingItem ? 'Edit Item' : 'Add Item' }}</h3>
      </div>

      <!-- Scrollable body -->
      <div class="flex-1 overflow-y-auto space-y-3 py-3 max-sm:pt-4">
        <input
          ref="itemNameInput"
          v-model="itemForm.name"
          :disabled="saving"
          placeholder="Item name"
          class="field disabled:opacity-60"
        />
        <select v-model="itemForm.room_id" :disabled="saving" required class="field disabled:opacity-60">
          <option value="" disabled>Select a room</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
        </select>
        <div class="grid gap-2 sm:grid-cols-2">
          <select v-model="itemForm.type" :disabled="saving" class="field text-sm disabled:opacity-60">
            <option value="furniture">Furniture</option>
            <option value="appliance">Appliance</option>
            <option value="decoration">Decoration</option>
            <option value="other">Other</option>
          </select>
          <input
            v-model="itemForm.estimated_price"
            :disabled="saving"
            type="number"
            step="0.01"
            placeholder="Manual estimate"
            class="field text-sm disabled:opacity-60"
          />
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <select v-model="itemForm.priority" :disabled="saving" class="field text-sm disabled:opacity-60">
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <select v-model="itemForm.status" :disabled="saving" class="field text-sm disabled:opacity-60">
            <option value="planned">Planned</option>
            <option value="researching">Researching</option>
            <option value="bought">Bought</option>
          </select>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-3">
            <h4 class="mono text-xs font-semibold uppercase tracking-[0.16em]" style="color: var(--tape)">
              Purchase options
            </h4>
            <button
              type="button"
              :disabled="saving"
              @click="emit('addOption')"
              class="btn-secondary shrink-0 px-3 py-1.5 text-xs"
            >
              + Add Option
            </button>
          </div>

          <div v-for="(option, index) in itemForm.purchase_options" :key="index" class="receipt-card space-y-2 p-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  :disabled="saving || index === 0"
                  @click="emit('moveUp', index)"
                  class="muted-copy transition-colors hover:opacity-80 disabled:opacity-30 disabled:cursor-default"
                  title="Move up"
                >
                  &#9650;
                </button>
                <button
                  type="button"
                  :disabled="saving || index >= itemForm.purchase_options.length - 1"
                  @click="emit('moveDown', index)"
                  class="muted-copy transition-colors hover:opacity-80 disabled:opacity-30 disabled:cursor-default"
                  title="Move down"
                >
                  &#9660;
                </button>
              </div>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 text-xs muted-copy">
                  <input type="checkbox" v-model="option.purchased" :disabled="saving" class="accent-[#6faf8a]" />
                  Purchased
                </label>
                <label class="flex items-center gap-2 text-xs muted-copy">
                  <input
                    type="radio"
                    name="preferred-option"
                    :checked="option.selected"
                    :disabled="saving"
                    @change="emit('selectOption', index)"
                    class="accent-[#d99a2b]"
                  />
                  Preferred
                </label>
                <button
                  type="button"
                  :disabled="saving"
                  @click="emit('removeOption', index)"
                  class="text-xs transition-colors hover:opacity-80 disabled:opacity-40"
                  style="color: var(--overrun)"
                >
                  Remove
                </button>
              </div>
            </div>
            <input
              v-model="option.label"
              :disabled="saving"
              placeholder="Model or name"
              class="field text-sm disabled:opacity-60"
            />
            <div class="grid gap-2 sm:grid-cols-2">
              <input
                v-model="option.store"
                :disabled="saving"
                placeholder="Store"
                class="field text-sm disabled:opacity-60"
              />
              <input
                :value="option.price"
                :disabled="saving"
                type="text"
                inputmode="numeric"
                placeholder="R$ 0,00"
                @focus="focusCurrencyInput(option)"
                @input="updateCurrencyInput(option, $event)"
                class="field text-sm disabled:opacity-60"
              />
            </div>
            <input
              v-model="option.url"
              :disabled="saving"
              type="url"
              placeholder="URL"
              class="field text-sm disabled:opacity-60"
            />
            <textarea
              v-model="option.notes"
              :disabled="saving"
              placeholder="Option notes"
              rows="2"
              class="field text-sm disabled:opacity-60"
            ></textarea>
          </div>
        </div>
        <textarea
          v-model="itemForm.notes"
          :disabled="saving"
          placeholder="Notes (dimensions, color, etc.)"
          rows="2"
          class="field text-sm disabled:opacity-60"
        ></textarea>
      </div>

      <!-- Fixed footer -->
      <div class="shrink-0 pt-3 border-t border-[rgba(231,222,208,0.14)]">
        <p v-if="formError" class="mb-2 text-sm" style="color: var(--overrun)">{{ formError }}</p>
        <div class="flex gap-2">
          <button type="submit" :disabled="saving" class="btn-primary flex-1 py-2.5">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <button type="button" :disabled="saving" @click="emit('close')" class="btn-secondary flex-1 py-2.5">
            Cancel
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
