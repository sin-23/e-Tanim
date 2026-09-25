<template>
  <div ref="root" class="relative">
    <button
      class="relative p-2 rounded-xl text-garden-dim hover:bg-garden-base hover:text-garden-primary transition-colors"
      aria-label="Notifications"
      @click="toggle"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-garden-danger text-white text-[10px] font-semibold flex items-center justify-center"
      >{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-garden-surface border border-garden-border rounded-2xl shadow-lg overflow-hidden z-20"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-garden-border">
        <h2 class="text-sm font-semibold text-garden-text">Notifications</h2>
        <button
          v-if="unreadCount > 0"
          class="text-[11px] font-semibold text-garden-primary hover:underline"
          @click="markAllRead"
        >Mark all read</button>
      </div>

      <div class="max-h-96 overflow-y-auto">
        <p v-if="loading" class="px-4 py-6 text-xs text-garden-dim text-center">Loading…</p>
        <p v-else-if="error" class="px-4 py-6 text-xs text-garden-danger text-center">{{ error }}</p>
        <p v-else-if="notifications.length === 0" class="px-4 py-6 text-xs text-garden-dim text-center">
          No notifications yet.
        </p>

        <ul v-else class="divide-y divide-garden-border">
          <li
            v-for="n in notifications"
            :key="n.id"
            class="flex gap-3 px-4 py-3"
            :class="n.unread ? 'bg-garden-base' : ''"
          >
            <span class="text-lg leading-none mt-0.5">{{ n.emoji }}</span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <span
                  class="text-[11px] font-semibold"
                  :class="n.tone === 'danger' ? 'text-garden-danger' : 'text-garden-good'"
                >{{ n.label }}</span>
                <span class="text-[10px] text-garden-dim flex-shrink-0">{{ timeAgo(n.createdAt) }}</span>
              </div>
              <p class="text-xs text-garden-text break-words">{{ n.message }}</p>
              <p v-if="n.source" class="text-[10px] text-garden-dim mt-0.5">{{ n.source }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotifications } from '@/composables/useNotifications'

const { notifications, unreadCount, loading, error, markAllRead } = useNotifications()

const open = ref(false)
const root = ref(null)
const now = ref(Date.now())
let timer = null

function toggle() { open.value = !open.value; now.value = Date.now() }
function onOutside(e) { if (root.value && !root.value.contains(e.target)) open.value = false }

function timeAgo(ms) {
  const s = Math.max(0, Math.floor((now.value - ms) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return new Date(ms).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

onMounted(() => {
  document.addEventListener('click', onOutside)
  timer = setInterval(() => { now.value = Date.now() }, 30000)
})
onUnmounted(() => {
  document.removeEventListener('click', onOutside)
  clearInterval(timer)
})
</script>