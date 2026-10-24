<template>
  <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4">
    <div class="flex items-center gap-3">
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        :style="{ backgroundColor: `color-mix(in srgb, ${tone} 12%, transparent)`, color: tone }"
      >
        <slot />
      </div>

      <div class="flex-1 min-w-0">
        <div class="text-xs font-bold text-garden-text truncate">{{ title }}</div>
        <div class="text-[0.5625rem] text-garden-dim mt-0.5 truncate">{{ subtitle }}</div>
      </div>

      <div class="text-right flex-shrink-0">
        <div class="flex items-center gap-1.5 justify-end">
          <div
            class="w-1.5 h-1.5 rounded-full"
            :class="active ? 'animate-pulse' : ''"
            :style="{ backgroundColor: tone }"
          />
          <span
            class="text-[0.625rem] font-bold"
            :style="{ color: tone }"
          >{{ status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  color: { type: String, default: '' },   // ignored: color now follows the status
  status: { type: String, required: true },
  active: { type: Boolean, default: false },
})

// Running = green (good), Locked = red (danger), anything else (Auto/idle) = neutral.
const tone = computed(() => {
  if (props.status === 'LOCKED') return 'rgb(var(--garden-danger))'
  if (props.active || props.status === 'RUNNING') return 'rgb(var(--garden-good))'
  return 'rgb(var(--garden-dim))'
})
</script>