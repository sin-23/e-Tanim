<template>
  <div class="font-sans text-garden-text">
    <div
      v-if="isConfigured"
      class="flex h-screen overflow-hidden bg-garden-void"
    >
      <SidebarNav :mobile-open="sidebarOpen" @close="sidebarOpen = false" />

      <div class="flex-1 flex flex-col overflow-hidden">
        <AppNavBar @menu-click="sidebarOpen = true" />
        <main class="flex-1 overflow-y-auto">
          <router-view />
        </main>
      </div>
    </div>

    <div v-else class="min-h-screen flex items-center justify-center p-6 bg-garden-void">
      <div class="max-w-md text-center space-y-4">
        <div class="text-5xl">🌱</div>
        <h1 class="font-display text-2xl font-bold text-garden-text">
          Firebase Not Configured
        </h1>
        <p class="text-garden-dim text-sm font-sans">
          Copy <code class="font-mono bg-garden-surface px-1 rounded">.env.example</code> to
          <code class="font-mono bg-garden-surface px-1 rounded">.env</code>
          and fill in your Firebase credentials, then restart the dev server.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppNavBar from '@/components/AppNavBar.vue'
import SidebarNav from '@/components/SidebarNav.vue'
import { isConfigured } from '@/firebase'
import { startRelayAutoOffWatcher } from '@/composables/useRelayAutoOff'

const sidebarOpen = ref(false)
startRelayAutoOffWatcher()
</script>