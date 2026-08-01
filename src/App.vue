<template>
  <div class="font-sans text-garden-text">

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
          <p class="font-mono text-xs text-garden-muted">
            Demo mode is disabled because authentication is required.
          </p>
        </div>
      </div>
    </template>

    <!-- Normal app: sidebar + header layout -->
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

    <!-- Auth pages (login/register) — no sidebar/header -->
    <template v-else>
      <router-view />
    </template>

  </div>
</template>

<script setup>
import { ref, computed, watch }        from 'vue'
import { useRoute }                    from 'vue-router'
import AppNavBar                       from '@/components/AppNavBar.vue'
import SidebarNav                      from '@/components/SidebarNav.vue'
import { isConfigured }                from '@/firebase'
import { currentUser }                 from '@/auth/useAuth'
import { startRelayAutoOffWatcher }    from '@/composables/useRelayAutoOff'

const route   = useRoute()
const showNav = computed(() =>
  route.name !== 'login' && route.name !== 'register'
)

const sidebarOpen = ref(false)

// Enforce relay auto-off deadlines app-wide, independent of which page is
// currently mounted — see useRelayAutoOff.js for why this can't live inside
// RelayControl.vue alone. Starts once a user is signed in, since turning a
// relay off requires an authenticated write per the database rules.
watch(currentUser, (user) => {
  if (user) startRelayAutoOffWatcher()
}, { immediate: true })
</script>