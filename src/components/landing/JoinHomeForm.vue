<script setup>
const joinId = defineModel('joinId', { type: String, default: '' })
defineEmits(['submit'])
</script>

<template>
  <form @submit.prevent="$emit('submit')" class="space-y-4">
    <div>
      <label class="mono mb-1 block text-xs uppercase tracking-[0.16em] muted-copy">Home ID or URL</label>
      <input v-model="joinId" placeholder="Paste the Home ID or full URL..." class="field" />
    </div>
    <button type="submit" :disabled="!joinId.trim()" class="btn-primary w-full py-3">Join Home</button>
  </form>
</template>
