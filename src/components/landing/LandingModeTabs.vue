<script setup>
const mode = defineModel({ type: String, required: true })
</script>

<template>
  <div class="tab-rail">
    <button @click="mode = 'create'" :class="mode === 'create' ? 'tab-button-active' : ''" class="tab-button">
      New Home
    </button>
    <button @click="mode = 'join'" :class="mode === 'join' ? 'tab-button-active' : ''" class="tab-button">
      Join Existing
    </button>
  </div>
</template>
