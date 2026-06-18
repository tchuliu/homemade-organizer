<script setup>
import { ref, watch, nextTick } from 'vue'
import { formatCurrency, parseMoneyValue, formatCurrencyInput } from '../lib/currency'
import { emptyPurchaseOption } from '../lib/purchaseOptions'

const props = defineProps({
  show: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])

const optionForm = ref(emptyPurchaseOption())
const labelInput = ref(null)

watch(() => props.show, async (visible) => {
  if (visible) {
    optionForm.value = emptyPurchaseOption()
    await nextTick()
    labelInput.value?.focus()
  }
})

function focusPrice(option) {
  if (option.price === '' || option.price === null || option.price === undefined) {
    option.price = formatCurrency(0)
  } else {
    option.price = formatCurrencyInput(option.price)
  }
}

function updatePrice(option, event) {
  const digits = event.target.value.replace(/\D/g, '')
  const amount = digits ? Number(digits) / 100 : 0
  option.price = formatCurrency(amount)
}

function handleSave() {
  if (!optionForm.value.label?.trim() && !optionForm.value.url?.trim()) return
  const price = parseMoneyValue(optionForm.value.price)
  emit('save', {
    label: optionForm.value.label?.trim() || '',
    store: optionForm.value.store?.trim() || '',
    price: price || 0,
    url: optionForm.value.url?.trim() || '',
    notes: '',
    selected: optionForm.value.selected,
    purchased: optionForm.value.purchased,
  })
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="emit('close')">
    <form @submit.prevent="handleSave" class="bg-gray-900 border border-gray-800 rounded-xl p-5 w-full max-w-sm space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-white">Quick Add Option</h3>
        <button type="button" @click="emit('close')" class="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button>
      </div>

      <input ref="labelInput" v-model="optionForm.label" placeholder="Model or name" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />

      <div class="grid gap-2 grid-cols-2">
        <input v-model="optionForm.store" placeholder="Store" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        <input
          :value="optionForm.price"
          type="text"
          inputmode="numeric"
          placeholder="R$ 0,00"
          @focus="focusPrice(optionForm)"
          @input="updatePrice(optionForm, $event)"
          class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <input v-model="optionForm.url" type="url" placeholder="URL" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />

      <div class="flex items-center gap-4">
        <label class="flex items-center gap-1.5 text-xs text-gray-400">
          <input type="checkbox" v-model="optionForm.purchased" class="accent-green-500" />
          Purchased
        </label>
        <label class="flex items-center gap-1.5 text-xs text-gray-400">
          <input type="checkbox" v-model="optionForm.selected" class="accent-indigo-500" />
          Preferred
        </label>
      </div>

      <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">Add Option</button>
    </form>
  </div>
</template>
