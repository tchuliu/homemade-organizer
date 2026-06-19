<script setup>
defineProps({
  homes: { type: Array, default: () => [] },
})

defineEmits(['open'])

function shortHomeId(homeId) {
  return homeId ? `${homeId.slice(0, 8)}...` : ''
}
</script>

<template>
  <div v-if="homes.length" class="panel space-y-3">
    <div>
      <h2 class="mono text-xs font-semibold uppercase tracking-[0.16em]" style="color: var(--tape)">Recent homes</h2>
      <p class="text-xs muted-copy">Quickly reopen a home you accessed before.</p>
    </div>
    <div class="space-y-2">
      <button
        v-for="home in homes"
        :key="home.id"
        @click="$emit('open', home.id)"
        class="receipt-card w-full px-3 py-2 text-left transition-colors hover:border-[rgba(217,154,43,0.5)]"
      >
        <span class="block truncate text-sm font-bold">{{ home.name || 'Unnamed home' }}</span>
        <span class="mono block text-xs muted-copy">ID: {{ shortHomeId(home.id) }}</span>
      </button>
    </div>
  </div>
</template>
