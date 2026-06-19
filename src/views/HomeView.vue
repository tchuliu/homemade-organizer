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
  <div class="landing-shell">
    <div class="landing-board">
      <div class="landing-hero">
        <p class="eyebrow">Shared moving plan</p>
        <h1 class="display-title mt-4">Build the home list before the boxes arrive.</h1>
        <p class="lead-copy mt-6">
          Organize rooms, compare purchase options, and keep the BRL budget visible while a new home is still taking
          shape.
        </p>
        <div class="floor-plan" aria-hidden="true">
          <span class="floor-label floor-label-a">living</span>
          <span class="floor-label floor-label-b">kitchen</span>
          <span class="floor-label floor-label-c">bedroom</span>
        </div>
      </div>

      <div class="landing-stack">
        <div class="panel space-y-4">
          <div>
            <p class="eyebrow">Homemade Organizer</p>
            <h2 class="section-title mt-2">Start a board</h2>
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
        </div>

        <RecentHomesList :homes="recentHomes" @open="openRecentHome" />
      </div>
    </div>
  </div>
</template>
