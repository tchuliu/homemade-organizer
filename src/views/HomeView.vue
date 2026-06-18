<script setup>
import { useHomeLanding } from '../composables/useHomeLanding'
import CreateHomeForm from '../components/landing/CreateHomeForm.vue'
import InstallAppButton from '../components/landing/InstallAppButton.vue'
import JoinHomeForm from '../components/landing/JoinHomeForm.vue'
import LandingModeTabs from '../components/landing/LandingModeTabs.vue'
import RecentHomesList from '../components/landing/RecentHomesList.vue'

const {
  createForm,
  joinId,
  loading,
  error,
  mode,
  recentHomes,
  canInstall,
  installPwa,
  openRecentHome,
  createHome,
  joinHome,
} = useHomeLanding()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-white">Homemade Organizer</h1>
        <p class="text-gray-400 mt-2">Plan furniture & appliances for your new home</p>
      </div>

      <InstallAppButton :can-install="canInstall" @install="installPwa" />
      <LandingModeTabs v-model="mode" />

      <CreateHomeForm
        v-if="mode === 'create'"
        v-model:form="createForm"
        :loading="loading"
        :error="error"
        @submit="createHome"
      />

      <JoinHomeForm v-if="mode === 'join'" v-model:join-id="joinId" @submit="joinHome" />

      <RecentHomesList :homes="recentHomes" @open="openRecentHome" />
    </div>
  </div>
</template>
