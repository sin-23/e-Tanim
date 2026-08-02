<template>
  <!-- Mobile overlay -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-20 bg-black/40 lg:hidden"
    @click="$emit('close')"
  />

  <!-- Sidebar -->
  <aside
    class="fixed top-0 left-0 z-30 h-full w-64 flex flex-col bg-[#1a2e22] text-white
           sidebar-transition lg:relative lg:translate-x-0 lg:z-auto lg:flex-shrink-0"
    :class="mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
  >
    <!-- Logo -->
    <div class="flex items-center justify-between px-5 pt-6 pb-5 border-b border-white/10">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-garden-primary flex items-center justify-center text-lg select-none">
          🌱
        </div>
        <div>
          <div class="text-lg font-bold tracking-tight leading-none">e-Tanim</div>
          <div class="text-[10px] text-white/50 font-medium tracking-widest uppercase mt-0.5">
            Smart Garden AI
          </div>
        </div>
      </div>
      <button
        class="lg:hidden p-1 rounded-lg text-white/60 hover:text-white hover:bg-garden-surface/10 transition-colors"
        @click="$emit('close')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <div class="px-2 pb-2 text-[10px] font-medium tracking-widest uppercase text-white/30">Navigation</div>

      <router-link
        to="/dashboard"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left"
        :class="isActive('dashboard')
          ? 'bg-garden-primary text-white shadow-sm'
          : 'text-white/60 hover:text-white hover:bg-garden-surface/8'"
        @click="$emit('close')"
      >
        <span :class="isActive('dashboard') ? 'text-white' : 'text-white/50'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </span>
        Dashboard
      </router-link>

      <router-link
        to="/irrigation"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left"
        :class="isActive('irrigation')
          ? 'bg-garden-primary text-white shadow-sm'
          : 'text-white/60 hover:text-white hover:bg-garden-surface/8'"
        @click="$emit('close')"
      >
        <span :class="isActive('irrigation') ? 'text-white' : 'text-white/50'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        </span>
        Irrigation &amp; Fertilization
      </router-link>

      <router-link
        to="/settings"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left"
        :class="isActive('settings')
          ? 'bg-garden-primary text-white shadow-sm'
          : 'text-white/60 hover:text-white hover:bg-white/8'"
        @click="$emit('close')"
      >
        <span :class="isActive('settings') ? 'text-white' : 'text-white/50'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </span>
        Settings
      </router-link>

      <!-- Upcoming pages — not built yet, shown for design parity, disabled -->
      <div
        v-for="item in comingSoonItems"
        :key="item.id"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left text-white/25 cursor-not-allowed"
        :title="'Coming soon'"
      >
        <span class="text-white/25" v-html="item.icon"></span>
        {{ item.label }}
      </div>
    </nav>

    <!-- System status footer -->
    <div class="px-4 py-4 border-t border-white/10">
      <div class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-garden-surface/5">
        <div class="w-2 h-2 rounded-full bg-garden-live animate-pulse" />
        <div>
          <div class="text-xs font-semibold text-white">System Online</div>
          <div class="text-[10px] text-white/40 font-mono">e-Tanim · IoT Active</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineProps({
  mobileOpen: { type: Boolean, default: false },
})
defineEmits(['close'])

const route = useRoute()
function isActive(id) {
  return route.name === id
}

const comingSoonItems = [
  // { id: 'crop-monitor', label: 'Crop Monitor', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>' },
  // { id: 'reservoir', label: 'Reservoir Levels', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
  // { id: 'sensor-logs', label: 'Sensor Logs', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
  // { id: 'analytics', label: 'Reports & Analytics', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
]
</script>