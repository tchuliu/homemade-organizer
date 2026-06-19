<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const form = defineModel('form', { type: Object, required: true })
defineEmits(['submit'])
</script>

<template>
  <form @submit.prevent="$emit('submit')" class="space-y-4">
    <div>
      <label class="mono mb-1 block text-xs uppercase tracking-[0.16em] muted-copy">Home name</label>
      <input v-model="form.name" placeholder="e.g. Our New Apartment" class="field" />
    </div>
    <div>
      <label class="mono mb-1 block text-xs uppercase tracking-[0.16em] muted-copy">Total budget (optional)</label>
      <input v-model="form.totalBudget" type="number" step="0.01" placeholder="0.00" class="field" />
    </div>
    <p v-if="error" class="text-sm" style="color: var(--overrun)">{{ error }}</p>
    <button type="submit" :disabled="loading || !form.name.trim()" class="btn-primary w-full py-3">
      {{ loading ? 'Creating...' : 'Create Home' }}
    </button>
  </form>
</template>
