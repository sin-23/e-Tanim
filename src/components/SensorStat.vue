<template>
  <div class="p-2.5 rounded-xl bg-[#f4f8f5] border border-garden-border">
    <div class="text-[9px] font-medium uppercase tracking-widest text-garden-dim mb-1">
      {{ label }}
    </div>
    <div class="flex flex-wrap items-center justify-between gap-1.5">
      <span class="text-base font-medium font-mono text-garden-text">{{ displayValue }}{{ unit }}</span>
      <span
        class="text-[9px] font-medium px-1.5 py-0.5 rounded-full border whitespace-nowrap"
        :style="{ backgroundColor: statusBg, color: statusColor, borderColor: statusBorder }"
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

// Matches Figma STATUS_COLORS map (LOW / NORMAL / HIGH)
const STATUS_MAP = {
  ok:      { text: 'NORMAL',  bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  low:     { text: 'LOW',     bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  high:    { text: 'HIGH',    bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  unknown: { text: 'NO DATA', bg: '#eef3f0', color: '#6b8070', border: '#d8e8de' },
}

const statusText   = computed(() => STATUS_MAP[props.status]?.text   ?? '—')
const statusBg      = computed(() => STATUS_MAP[props.status]?.bg     ?? '#eef3f0')
const statusColor   = computed(() => STATUS_MAP[props.status]?.color  ?? '#6b8070')
const statusBorder  = computed(() => STATUS_MAP[props.status]?.border ?? '#d8e8de')
</script>
