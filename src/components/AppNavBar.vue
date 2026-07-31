<template>
  <header class="sticky top-0 z-10 bg-white border-b border-garden-border px-4 lg:px-6 py-3 flex items-center gap-3">

    <!-- Mobile menu button -->
    <button
      class="lg:hidden p-2 rounded-xl text-garden-dim hover:bg-garden-base hover:text-garden-primary transition-colors"
      @click="$emit('menu-click')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <!-- Page title -->
    <div class="flex-1 min-w-0">
      <h1 class="text-base font-semibold text-garden-text truncate hidden sm:block">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Live status badge -->
    <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-garden-good/10 border border-garden-good/30">
      <span class="relative flex h-1.5 w-1.5">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-garden-live opacity-60"></span>
        <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-garden-live"></span>
      </span>
      <span class="text-xs font-semibold text-garden-good">Online</span>
    </div>

    <!-- Clock -->
    <div class="hidden lg:block text-right">
      <div class="text-xs font-semibold text-garden-text">{{ dateStr }}</div>
      <div class="text-[10px] font-mono text-garden-dim">{{ clock }}</div>
    </div>

    <!-- Login button (when not logged in) -->
    <router-link
      v-if="!isLoggedIn"
      to="/login"
      class="inline-flex font-mono text-[11px] uppercase tracking-widest
             px-2.5 py-1.5 rounded-xl border border-garden-border text-garden-dim
             hover:text-garden-primary hover:bg-garden-base transition-colors"
    >
      Login
    </router-link>

    <!-- User menu (when logged in) -->
    <div v-if="isLoggedIn" class="relative" ref="menuRef">
      <button
        class="w-9 h-9 rounded-xl bg-garden-primary flex items-center justify-center text-white
               hover:bg-[#246040] transition-colors flex-shrink-0"
        @click="menuOpen = !menuOpen"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </button>

      <!-- Dropdown -->
      <div
        v-if="menuOpen"
        class="absolute right-0 top-full mt-2 w-52 bg-garden-surface border
               border-garden-border rounded-xl shadow-card overflow-hidden z-50"
      >
        <!-- User info -->
        <div class="px-4 py-3 border-b border-garden-border">
          <div class="font-sans font-semibold text-garden-text text-sm truncate">
            {{ currentUser?.displayName || 'User' }}
          </div>
          <div class="font-mono text-[11px] text-garden-dim truncate">
            {{ currentUser?.email }}
          </div>
        </div>

        <!-- Sign out -->
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
import { useRoute, useRouter }                   from 'vue-router'
import { useAuth }                               from '@/auth/useAuth'

defineEmits(['menu-click'])

const route  = useRoute()
const router = useRouter()
const { currentUser, isLoggedIn, logout } = useAuth()

const PAGE_TITLES = {
  dashboard:  'Dashboard Overview',
  irrigation: 'Irrigation & Fertilization',
}
const pageTitle = computed(() => PAGE_TITLES[route.name] || 'Dashboard Overview')

// Clock
const clock   = ref('')
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

onMounted(() => { tick(); clockTimer = setInterval(tick, 1000) })
onUnmounted(() => clearInterval(clockTimer))

// User display
const displayName = computed(() =>
  currentUser.value?.displayName || currentUser.value?.email || 'User'
)

// User menu
const menuOpen   = ref(false)
const menuRef    = ref(null)
const signingOut = ref(false)

function handleOutsideClick(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) menuOpen.value = false
}

onMounted(()  => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))

async function handleLogout() {
  signingOut.value = true
  menuOpen.value   = false
  try {
    await logout()
    router.push('/login')
  } finally {
    signingOut.value = false
  }
}
</script>
