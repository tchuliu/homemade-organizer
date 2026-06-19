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

watch(
  () => props.show,
  async (visible) => {
    if (visible) {
      optionForm.value = emptyPurchaseOption()
      await nextTick()
      labelInput.value?.focus()
    }
  },
)

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
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <form @submit.prevent="handleSave" class="panel w-full max-w-sm space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="mono text-sm font-semibold uppercase tracking-[0.16em]" style="color: var(--tape)">
          Quick Add Option
        </h3>
        <button type="button" @click="emit('close')" class="text-lg leading-none muted-copy hover:opacity-80">
          &times;
        </button>
      </div>

      <input ref="labelInput" v-model="optionForm.label" placeholder="Model or name" class="field text-sm" />

      <div class="grid gap-2 grid-cols-2">
        <input v-model="optionForm.store" placeholder="Store" class="field text-sm" />
        <input
          :value="optionForm.price"
          type="text"
          inputmode="numeric"
          placeholder="R$ 0,00"
          @focus="focusPrice(optionForm)"
          @input="updatePrice(optionForm, $event)"
          class="field text-sm"
        />
      </div>

      <input v-model="optionForm.url" type="url" placeholder="URL" class="field text-sm" />

      <div class="flex items-center gap-4">
        <label class="flex items-center gap-1.5 text-xs muted-copy">
          <input type="checkbox" v-model="optionForm.purchased" class="accent-[#6faf8a]" />
          Purchased
        </label>
        <label class="flex items-center gap-1.5 text-xs muted-copy">
          <input type="checkbox" v-model="optionForm.selected" class="accent-[#d99a2b]" />
          Preferred
        </label>
      </div>

      <button type="submit" class="btn-primary w-full py-2.5 text-sm">Add Option</button>
    </form>
  </div>
</template>
