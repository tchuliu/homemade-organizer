<script setup>
defineProps({
  home: { type: Object, required: true },
})

defineEmits(['back', 'copyLink'])
</script>

<template>
  <div class="panel flex flex-wrap items-center justify-between gap-4">
    <div>
      <p class="eyebrow">Home board</p>
      <h1 class="section-title mt-2">{{ home.name }}</h1>
      <p class="mono mt-2 text-xs muted-copy">ID: {{ home.id }}</p>
    </div>
    <div class="flex gap-2">
      <button @click="$emit('back')" class="btn-secondary px-4 py-2 text-sm">Home</button>
      <button @click="$emit('copyLink')" class="btn-primary px-4 py-2 text-sm">Copy Link</button>
    </div>
  </div>
</template>
