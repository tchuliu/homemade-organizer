<script setup>
const activeTab = defineModel({ type: String, required: true })

const tabs = ['rooms', 'items', 'budget']
</script>

<template>
  <div class="tab-rail">
    <button
      v-for="tab in tabs"
      :key="tab"
      @click="activeTab = tab"
      :class="activeTab === tab ? 'tab-button-active' : ''"
      class="tab-button text-sm capitalize"
    >
      {{ tab }}
    </button>
  </div>
</template>
