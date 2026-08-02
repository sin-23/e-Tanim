<template>
  <div class="relative flex flex-col items-center gap-1">
    <!-- SVG Ring Gauge -->
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      class="block"
      role="img"
      :aria-label="`${label}: ${displayValue}`"
    >
      <!-- Track ring -->
      <circle
        :cx="cx" :cy="cy" :r="r"
        fill="none"
        :stroke-width="strokeWidth"
        stroke="rgb(var(--garden-border))"
        stroke-linecap="round"
      />
      <!-- Value arc -->
      <circle
        :cx="cx" :cy="cy" :r="r"
        fill="none"
        :stroke-width="strokeWidth"
        :stroke="color"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :class="['transition-all duration-700 ease-out', glowClass]"
        transform="rotate(-90)"
        :transform-origin="`${cx} ${cy}`"
      />
      <!-- Center value -->
      <text
        :x="cx" :y="cy - 4"
        text-anchor="middle"
        dominant-baseline="middle"
        :fill="color"
        :font-size="valueFontSize"
        font-family="'DM Mono', monospace"
        font-weight="800"
        class="transition-all duration-500"
      >{{ displayValue }}</text>
      <!-- Unit label -->
      <text
        :x="cx" :y="cy + valueFontSize * 0.85"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="rgb(var(--garden-dim))"
        :font-size="unitFontSize"
        font-family="'Nunito', sans-serif"
        font-weight="400"
      >{{ unit }}</text>
    </svg>

    <!-- Label + status dot -->
    <div v-if="showLabel" class="flex items-center gap-1.5 mt-0.5">
      <span
        class="w-1.5 h-1.5 rounded-full transition-colors duration-300"
        :style="{ background: statusColor }"
      ></span>
      <span class="text-[10px] font-medium text-garden-dim uppercase tracking-widest">{{ label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value:       { type: Number, default: null },
  min:         { type: Number, default: 0 },
  max:         { type: Number, default: 100 },
  unit:        { type: String, default: '%' },
  label:       { type: String, default: 'Sensor' },
  color:       { type: String, default: '#00E676' },
  status:      { type: String, default: 'ok' },   // 'ok' | 'low' | 'high' | 'unknown'
  size:        { type: Number, default: 120 },
  strokeWidth: { type: Number, default: 8 },
  showLabel:   { type: Boolean, default: true },
})

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)
const r  = computed(() => (props.size - props.strokeWidth) / 2 - 2)

const circumference = computed(() => 2 * Math.PI * r.value)

const clampedPercent = computed(() => {
  if (props.value === null) return 0
  return Math.min(1, Math.max(0, (props.value - props.min) / (props.max - props.min)))
})

const dashOffset = computed(() =>
  circumference.value * (1 - clampedPercent.value)
)

const displayValue = computed(() =>
  props.value === null ? '—' : String(props.value)
)

const valueFontSize = computed(() => Math.round(props.size * 0.175))
const unitFontSize  = computed(() => Math.round(props.size * 0.10))

const STATUS_COLORS = {
  ok:      '#00E676',
  low:     '#FFD740',
  high:    '#FF5252',
  unknown: '#3D6347',
}

const statusColor = computed(() => STATUS_COLORS[props.status] ?? STATUS_COLORS.unknown)

const glowClass = computed(() => {
  if (props.status === 'ok')   return 'drop-shadow-[0_0_6px_rgba(0,230,118,0.5)]'
  if (props.status === 'low')  return 'drop-shadow-[0_0_6px_rgba(255,215,64,0.5)]'
  if (props.status === 'high') return 'drop-shadow-[0_0_6px_rgba(255,82,82,0.5)]'
  return ''
})
</script>