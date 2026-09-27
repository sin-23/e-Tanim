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
      <div class="text-[10px] font-mono text-garden-dim">{{ clock }}</div>
    </div>
    <div class="sm:hidden text-[10px] font-mono text-garden-dim">{{ clock }}</div>

    <NotificationBell />
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import NotificationBell from '@/components/NotificationBell.vue'

defineEmits(['menu-click'])

const route = useRoute()
const pageTitle = computed(() => route.meta?.title || 'e-Tanim')

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

onMounted(() => { tick(); clockTimer = setInterval(tick, 1000) })
onUnmounted(() => clearInterval(clockTimer))
</script>