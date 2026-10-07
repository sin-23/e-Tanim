<template>
  <div class="font-sans text-garden-text">

    <!-- Top loading bar while a route resolves (auth check / lazy chunk) -->
    <div
      v-if="isNavigating"
      class="fixed top-0 left-0 right-0 h-0.5 z-[100] bg-garden-primary/20 overflow-hidden"
    >
      <div class="h-full w-1/3 bg-garden-primary animate-loading-bar" />
    </div>

    <!-- Firebase not configured -->
    <template v-if="!isConfigured">
      <div class="min-h-screen flex items-center justify-center p-6 bg-garden-void">
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
    </template>

    <!-- App shell: sidebar + header -->
    <template v-else-if="showNav">
      <div class="flex h-screen overflow-hidden bg-garden-void">
        <SidebarNav :mobile-open="sidebarOpen" @close="sidebarOpen = false" />

        <div class="flex-1 flex flex-col overflow-hidden">
          <AppNavBar @menu-click="sidebarOpen = true" />
          <main class="flex-1 overflow-y-auto">
            <router-view />
          </main>
        </div>
      </div>
    </template>

    <!-- Mid-logout: nav already hidden, /login still resolving -->
    <template v-else-if="loggingOut">
      <div class="min-h-screen flex items-center justify-center bg-garden-void">
        <div class="flex items-center gap-2.5 text-garden-dim text-sm font-medium">
          <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
          </svg>
          Signing out…
        </div>
      </div>
    </template>

    <!-- Auth pages (login / register / reset-password) — no sidebar/header -->
    <template v-else>
      <router-view />
    </template>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppNavBar from '@/components/AppNavBar.vue'
import SidebarNav from '@/components/SidebarNav.vue'
import { isConfigured } from '@/firebase'
import { currentUser, loggingOut } from '@/auth/useAuth'
import { isNavigating } from '@/router'
import { startRelayAutoOffWatcher } from '@/composables/useRelayAutoOff'

const route = useRoute()

const AUTH_ROUTES = ['login', 'register', 'reset-password']

// Tied to loggingOut so the shell hides the instant Sign Out is clicked.
const showNav = computed(() =>
  !AUTH_ROUTES.includes(route.name) && !loggingOut.value
)

const sidebarOpen = ref(false)

// Relay auto-off writes need an authenticated user (see database.rules.json),
// so the watcher only starts once someone is signed in.
watch(currentUser, (user) => {
  if (user) startRelayAutoOffWatcher()
}, { immediate: true })
</script>