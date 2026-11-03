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
      <!-- Harvest check: act, or show the shared resolution with Undo -->
      <div v-if="notification.type === 'harvest_check'" class="mt-1.5">
        <p v-if="!notification.resolved" class="text-[0.6875rem] text-garden-dim mb-1.5">Is the fruit still on the plant?</p>
        <div v-if="!notification.resolved" class="flex flex-wrap gap-1.5">
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg border border-garden-border text-[0.6875rem] font-bold text-garden-text hover:bg-garden-base disabled:opacity-50"
            :disabled="busy"
            @click.stop="$emit('resolve', notification, 'not_harvested')"
          >Still on the plant</button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg border border-garden-border text-[0.6875rem] font-bold text-garden-dim hover:bg-garden-base disabled:opacity-50"
            :disabled="busy"
            @click.stop="$emit('resolve', notification, 'dismissed')"
          >Keep as harvested</button>
        </div>
        <p v-else class="text-[0.6875rem] text-garden-dim">
          {{ resolutionText }}
          <button
            v-if="notification.canUndo"
            type="button"
            class="ml-1 font-bold text-garden-text underline underline-offset-2 hover:text-garden-dim disabled:opacity-50"
            :disabled="busy"
            @click.stop="$emit('undo', notification)"
          >Undo</button>
          <span v-if="notification.currentNote" class="block mt-0.5">{{ notification.currentNote }}</span>
        </p>
      </div>
    </div>
  </li>

  <!-- Alerts list: tinted card with an unread dot -->
  <div
    v-else
    class="flex items-start gap-2.5 p-3 rounded-xl border transition-all duration-200"
    :class="[
      cardClasses,
      notification.unread || notification.resolved ? '' : 'opacity-50',
    ]"
  >
    <span class="text-base flex-shrink-0 mt-0.5">{{ notification.emoji }}</span>
    <div class="min-w-0 flex-1">
      <div class="text-xs font-semibold leading-snug" :class="toneText">{{ notification.message }}</div>
      <div class="text-[0.625rem] text-garden-dim mt-0.5">{{ timeText }}</div>
      <!-- Harvest check: act, or show the shared resolution with Undo -->
      <div v-if="notification.type === 'harvest_check'" class="mt-1.5">
        <p v-if="!notification.resolved" class="text-[0.6875rem] text-garden-dim mb-1.5">Is the fruit still on the plant?</p>
        <div v-if="!notification.resolved" class="flex flex-wrap gap-1.5">
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg border border-garden-border text-[0.6875rem] font-bold text-garden-text hover:bg-garden-base disabled:opacity-50"
            :disabled="busy"
            @click.stop="$emit('resolve', notification, 'not_harvested')"
          >Still on the plant</button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg border border-garden-border text-[0.6875rem] font-bold text-garden-dim hover:bg-garden-base disabled:opacity-50"
            :disabled="busy"
            @click.stop="$emit('resolve', notification, 'dismissed')"
          >Keep as harvested</button>
        </div>
        <p v-else class="text-[0.6875rem] text-garden-dim">
          {{ resolutionText }}
          <button
            v-if="notification.canUndo"
            type="button"
            class="ml-1 font-bold text-garden-text underline underline-offset-2 hover:text-garden-dim disabled:opacity-50"
            :disabled="busy"
            @click.stop="$emit('undo', notification)"
          >Undo</button>
          <span v-if="notification.currentNote" class="block mt-0.5">{{ notification.currentNote }}</span>
        </p>
      </div>
    </div>
    <div
      v-if="notification.unread && !notification.resolved"
      class="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
      :class="dotClass"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TONE } from '@/utils/statusTone'
import { formatDateTime } from '@/utils/formatTime'

const props = defineProps({
  notification: { type: Object, required: true },
  variant:      { type: String, default: 'bell' },   // 'bell' | 'alert'
  timeText:     { type: String, default: '' },
  busy:         { type: Boolean, default: false },   // a resolve or undo is being saved
})
// 'dismiss' is the bell's X (hides it in this browser only).
// 'resolve' and 'undo' are the shared harvest check actions.
defineEmits(['dismiss', 'resolve', 'undo'])

const toneText = computed(() => {
  if (props.notification.resolved) return 'text-garden-dim'
  const t = props.notification.tone
  if (t === 'danger') return 'text-garden-danger'
  if (t === 'warn')   return 'text-garden-warn'
  return 'text-garden-good'
})
const cardClasses = computed(() => {
  if (props.notification.resolved) return 'bg-garden-base border-garden-border'
  const t = props.notification.tone
  if (t === 'danger') return 'bg-garden-danger/10 border-garden-danger/30'
  if (t === 'warn')   return `${TONE.warn.tint} ${TONE.warn.border}`
  return 'bg-garden-good/10 border-garden-good/30'
})
const dotClass = computed(() => {
  const t = props.notification.tone
  if (t === 'danger') return 'bg-garden-danger'
  if (t === 'warn')   return TONE.warn.dot
  return 'bg-garden-good'
})

// "Marked still on the plant by Ana, 12:31 PM" / "Kept as harvested by Ana, ..."
const resolutionText = computed(() => {
  const n = props.notification
  const who = n.resolvedBy || 'a user'
  const when = n.resolvedAt ? formatDateTime(n.resolvedAt) : ''
  const verb = n.resolution === 'not_harvested' ? 'Marked still on the plant' : 'Kept as harvested'
  return `${verb} by ${who}${when ? ', ' + when : ''}`
})
</script>