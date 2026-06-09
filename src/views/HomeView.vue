<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const name = ref('')
const totalBudget = ref('')
const joinId = ref('')
const loading = ref(false)
const error = ref('')
const mode = ref('create')

async function createHome() {
  if (!name.value.trim()) return
  loading.value = true
  error.value = ''

  const { data, error: err } = await supabase
    .from('homes')
    .insert({ name: name.value.trim(), total_budget: parseFloat(totalBudget.value) || 0 })
    .select()
    .single()

  if (err) { error.value = err.message; loading.value = false; return }

  router.push(`/home/${data.id}`)
}

function joinHome() {
  if (!joinId.value.trim()) return
  const id = joinId.value.trim()
  router.push(`/home/${id}`)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-white">Homemade Organizer</h1>
        <p class="text-gray-400 mt-2">Plan furniture & appliances for your new home</p>
      </div>

      <div class="flex gap-2 justify-center">
        <button
          @click="mode = 'create'"
          :class="mode === 'create' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
        >New Home</button>
        <button
          @click="mode = 'join'"
          :class="mode === 'join' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
        >Join Existing</button>
      </div>

      <div v-if="mode === 'create'" class="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Home Name</label>
          <input
            v-model="name"
            placeholder="e.g. Our New Apartment"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Total Budget (optional)</label>
          <input
            v-model="totalBudget"
            type="number"
            step="0.01"
            placeholder="0.00"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
        <button
          @click="createHome"
          :disabled="loading || !name.trim()"
          class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {{ loading ? 'Creating...' : 'Create Home' }}
        </button>
      </div>

      <div v-if="mode === 'join'" class="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Home ID or URL</label>
          <input
            v-model="joinId"
            placeholder="Paste the Home ID or full URL..."
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          @click="joinHome"
          :disabled="!joinId.trim()"
          class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          Join Home
        </button>
      </div>
    </div>
  </div>
</template>
