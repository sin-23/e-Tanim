<template>
  <div class="p-2.5 rounded-xl bg-garden-void border border-garden-border">
    <div class="text-[9px] font-medium uppercase tracking-widest text-garden-dim mb-1">
      {{ label }}
    </div>
    <div class="flex flex-wrap items-center justify-between gap-1.5">
      <span class="text-base font-medium font-mono text-garden-text">{{ displayValue }}{{ unit }}</span>
      <span
        class="text-[9px] font-medium px-1.5 py-0.5 rounded-full border whitespace-nowrap"
        :class="statusClass"
      >{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value:  { type: Number, default: null },
  unit:   { type: String, default: '' },
  label:  { type: String, default: '' },
  color:  { type: String, default: '#C8E6C9' },
  status: { type: String, default: 'ok' },
})

const displayValue = computed(() =>
  props.value === null ? '—' : String(props.value)
)

// Matches Figma STATUS_COLORS map (LOW / NORMAL / HIGH) — driven by the
// theme-aware garden-* tokens so badges stay legible in dark mode instead
// of the previous fixed light-mode hex values.
const STATUS_MAP = {
  ok:      { text: 'NORMAL',  class: 'bg-garden-good/15 text-garden-good border-garden-good/40' },
  low:     { text: 'LOW',     class: 'bg-garden-warn/15 text-garden-warn border-garden-warn/40' },
  high:    { text: 'HIGH',    class: 'bg-garden-danger/15 text-garden-danger border-garden-danger/40' },
  unknown: { text: 'NO DATA', class: 'bg-garden-base text-garden-dim border-garden-border' },
}

const statusText  = computed(() => STATUS_MAP[props.status]?.text  ?? '—')
const statusClass = computed(() => STATUS_MAP[props.status]?.class ?? STATUS_MAP.unknown.class)
</script>