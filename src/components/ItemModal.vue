<script setup>
import { watch, ref, nextTick } from 'vue'
import { formatCurrency, parseMoneyValue, formatCurrencyInput } from '../lib/currency'

const props = defineProps({
  show: { type: Boolean, default: false },
  itemForm: { type: Object, required: true },
  rooms: { type: Array, default: () => [] },
  editingItem: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  formError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save', 'addOption', 'removeOption', 'moveUp', 'moveDown', 'selectOption'])

const itemNameInput = ref(null)

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
    class="fixed inset-0 z-50 bg-black/60 sm:flex sm:items-center sm:justify-center sm:p-4 sm:overflow-y-auto"
    @click.self="!saving && emit('close')"
  >
    <form
      @submit.prevent="emit('save')"
      class="bg-gray-900 border border-gray-800 sm:rounded-xl p-6 w-full sm:max-w-xl flex flex-col max-sm:fixed max-sm:inset-0 max-sm:rounded-none max-sm:border-0 max-sm:h-[100dvh] sm:my-8"
    >
      <!-- Fixed header -->
      <div class="shrink-0">
        <h3 class="text-lg font-semibold text-white">{{ editingItem ? 'Edit Item' : 'Add Item' }}</h3>
      </div>

      <!-- Scrollable body -->
      <div class="flex-1 overflow-y-auto space-y-3 py-3 max-sm:pt-4">
        <input
          ref="itemNameInput"
          v-model="itemForm.name"
          :disabled="saving"
          placeholder="Item name"
          class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
        />
        <select
          v-model="itemForm.room_id"
          :disabled="saving"
          required
          class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white disabled:opacity-60 focus:outline-none focus:border-indigo-500"
        >
          <option value="" disabled>Select a room</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
        </select>
        <div class="grid gap-2 sm:grid-cols-2">
          <select
            v-model="itemForm.type"
            :disabled="saving"
            class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-60 focus:outline-none focus:border-indigo-500"
          >
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
            class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <select
            v-model="itemForm.priority"
            :disabled="saving"
            class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-60 focus:outline-none focus:border-indigo-500"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <select
            v-model="itemForm.status"
            :disabled="saving"
            class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-60 focus:outline-none focus:border-indigo-500"
          >
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
              :disabled="saving"
              @click="emit('addOption')"
              class="shrink-0 rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700 disabled:text-gray-500"
            >
              + Add Option
            </button>
          </div>

          <div
            v-for="(option, index) in itemForm.purchase_options"
            :key="index"
            class="space-y-2 rounded-lg border border-gray-800 p-3"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  :disabled="saving || index === 0"
                  @click="emit('moveUp', index)"
                  class="text-gray-500 hover:text-gray-300 disabled:text-gray-700 disabled:cursor-default transition-colors"
                  title="Move up"
                >
                  &#9650;
                </button>
                <button
                  type="button"
                  :disabled="saving || index >= itemForm.purchase_options.length - 1"
                  @click="emit('moveDown', index)"
                  class="text-gray-500 hover:text-gray-300 disabled:text-gray-700 disabled:cursor-default transition-colors"
                  title="Move down"
                >
                  &#9660;
                </button>
              </div>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 text-xs text-gray-400">
                  <input type="checkbox" v-model="option.purchased" :disabled="saving" class="accent-green-500" />
                  Purchased
                </label>
                <label class="flex items-center gap-2 text-xs text-gray-400">
                  <input
                    type="radio"
                    name="preferred-option"
                    :checked="option.selected"
                    :disabled="saving"
                    @change="emit('selectOption', index)"
                    class="accent-indigo-500"
                  />
                  Preferred
                </label>
                <button
                  type="button"
                  :disabled="saving"
                  @click="emit('removeOption', index)"
                  class="text-xs text-red-300 transition-colors hover:text-red-200 disabled:text-gray-500"
                >
                  Remove
                </button>
              </div>
            </div>
            <input
              v-model="option.label"
              :disabled="saving"
              placeholder="Model or name"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
            />
            <div class="grid gap-2 sm:grid-cols-2">
              <input
                v-model="option.store"
                :disabled="saving"
                placeholder="Store"
                class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
              />
              <input
                :value="option.price"
                :disabled="saving"
                type="text"
                inputmode="numeric"
                placeholder="R$ 0,00"
                @focus="focusCurrencyInput(option)"
                @input="updateCurrencyInput(option, $event)"
                class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <input
              v-model="option.url"
              :disabled="saving"
              type="url"
              placeholder="URL"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
            />
            <textarea
              v-model="option.notes"
              :disabled="saving"
              placeholder="Option notes"
              rows="2"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
            ></textarea>
          </div>
        </div>
        <textarea
          v-model="itemForm.notes"
          :disabled="saving"
          placeholder="Notes (dimensions, color, etc.)"
          rows="2"
          class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
        ></textarea>
      </div>

      <!-- Fixed footer -->
      <div class="shrink-0 pt-3 border-t border-gray-800">
        <p v-if="formError" class="text-sm text-red-400 mb-2">{{ formError }}</p>
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
      </div>
    </form>
  </div>
</template>
