<template>
  <header class="sticky top-0 z-10 bg-garden-surface border-b border-garden-border px-4 lg:px-6 py-3 flex items-center gap-3 transition-colors duration-200">
    <button
      class="lg:hidden p-2 rounded-xl text-garden-dim hover:bg-garden-base hover:text-garden-primary transition-colors"
      @click="$emit('menu-click')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <div class="flex-1 min-w-0">
      <h1 class="text-base font-bold text-garden-text truncate hidden sm:block">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Date/time -->
    <div class="text-right hidden sm:block">
      <div class="text-xs font-semibold text-garden-text">{{ dateStr }}</div>
      <div class="text-[0.625rem] font-mono text-garden-dim">{{ clock }}</div>
    </div>
    <div class="sm:hidden text-[0.625rem] font-mono text-garden-dim">{{ clock }}</div>

    <NotificationBell />

    <!-- User menu -->
    <div v-if="isLoggedIn" class="relative" ref="menuRef">
      <button
        class="w-9 h-9 rounded-xl bg-garden-primary flex items-center justify-center text-white
               hover:opacity-90 transition-opacity flex-shrink-0"
        :aria-label="'Account menu for ' + displayName"
        @click="menuOpen = !menuOpen"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </button>

      <div
        v-if="menuOpen"
        class="absolute right-0 top-full mt-2 w-52 bg-garden-surface border
               border-garden-border rounded-xl shadow-card overflow-hidden z-50"
      >
        <div class="px-4 py-3 border-b border-garden-border">
          <div class="font-sans font-semibold text-garden-text text-sm truncate">
            {{ currentUser?.displayName || 'User' }}
          </div>
          <div class="font-mono text-[0.6875rem] text-garden-dim truncate">
            {{ currentUser?.email }}
          </div>
        </div>

        <button
          class="w-full flex items-center gap-2 px-4 py-2.5 font-mono text-xs
                 text-garden-danger hover:bg-garden-danger/5 transition-colors text-left"
          :disabled="signingOut"
          @click="handleLogout"
        >
          {{ signingOut ? 'Signing out…' : '→ Sign Out' }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/auth/useAuth'
import NotificationBell from '@/components/NotificationBell.vue'

defineEmits(['menu-click'])

const route = useRoute()
const router = useRouter()
const { currentUser, isLoggedIn, logout } = useAuth()

const pageTitle = computed(() => route.meta?.title || 'e-Tanim')
const displayName = computed(() =>
  currentUser.value?.displayName || currentUser.value?.email || 'User'
)

// ── Clock ──────────────────────────────────────────────────────────
const clock = ref('')
const dateStr = ref('')
let clockTimer = null

function tick() {
  const now = new Date()
  clock.value = now.toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  dateStr.value = now.toLocaleDateString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ── User menu ──────────────────────────────────────────────────────
const menuOpen = ref(false)
const menuRef = ref(null)
const signingOut = ref(false)

function handleOutsideClick(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) menuOpen.value = false
}

onMounted(() => {
  tick()
  clockTimer = setInterval(tick, 1000)
  document.addEventListener('mousedown', handleOutsideClick)
})
onUnmounted(() => {
  clearInterval(clockTimer)
  document.removeEventListener('mousedown', handleOutsideClick)
})

async function handleLogout() {
  signingOut.value = true
  menuOpen.value = false
  // logout() sets loggingOut=true synchronously, so the router guard already
  // treats the session as over by the time router.push runs.
  const logoutPromise = logout()
  router.push('/login')
  try {
    await logoutPromise
  } finally {
    signingOut.value = false
  }
}
</script>