<template>
  <!-- Bell: compact row, with a dismiss button -->
  <li v-if="variant === 'bell'" class="flex gap-3 px-4 py-3" :class="notification.unread ? 'bg-garden-base' : ''">
    <span class="text-lg leading-none mt-0.5">{{ notification.emoji }}</span>
    <div class="min-w-0 flex-1">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[0.6875rem] font-semibold" :class="toneText">{{ notification.label }}</span>
        <div class="flex items-center gap-1 flex-shrink-0">
          <span class="text-[0.625rem] text-garden-dim">{{ timeText }}</span>
          <button
            class="p-0.5 rounded text-garden-dim hover:text-garden-text hover:bg-garden-base transition-colors"
            aria-label="Dismiss notification"
            title="Dismiss"
            @click.stop="$emit('dismiss', notification.id)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <p class="text-xs text-garden-text break-words">{{ notification.message }}</p>
      <p v-if="notification.source" class="text-[0.625rem] text-garden-dim mt-0.5">{{ notification.source }}</p>
    </div>
  </li>

  <!-- Alerts list: tinted card with an unread dot -->
  <div
    v-else
    class="flex items-start gap-2.5 p-3 rounded-xl border transition-all duration-200"
    :class="[
      notification.tone === 'danger' ? 'bg-garden-danger/10 border-garden-danger/30' : 'bg-garden-good/10 border-garden-good/30',
      notification.unread ? '' : 'opacity-50',
    ]"
  >
    <span class="text-base flex-shrink-0 mt-0.5">{{ notification.emoji }}</span>
    <div class="min-w-0 flex-1">
      <div class="text-xs font-semibold leading-snug" :class="toneText">{{ notification.message }}</div>
      <div class="text-[0.625rem] text-garden-dim mt-0.5">{{ timeText }}</div>
    </div>
    <div
      v-if="notification.unread"
      class="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
      :class="notification.tone === 'danger' ? 'bg-garden-danger' : 'bg-garden-good'"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  notification: { type: Object, required: true },
  variant:      { type: String, default: 'bell' },   // 'bell' | 'alert'
  timeText:     { type: String, default: '' },
})
defineEmits(['dismiss'])

const toneText = computed(() => props.notification.tone === 'danger' ? 'text-garden-danger' : 'text-garden-good')
</script>