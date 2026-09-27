<template>
  <div class="rounded-xl p-2.5" :class="bgClass">
    <div class="text-[8px] font-bold uppercase tracking-widest text-garden-dim mb-1 truncate">
      {{ label }}
    </div>
    <div class="flex items-baseline gap-1 flex-wrap">
      <span class="text-base font-extrabold font-mono leading-none" :class="valueClass">{{ displayValue }}</span>
      <span v-if="unit" class="text-[9px] font-medium text-garden-dim leading-none">{{ unit }}</span>
    </div>
    <div
      v-if="showPill"
      class="inline-flex mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
      :class="pillClass"
    >{{ pillText }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value:    { type: Number, default: null },
  unit:     { type: String, default: '' },
  label:    { type: String, default: '' },
  status:   { type: String, default: 'ok' },   // ok | low | high | unknown
  // Which theme-aware garden-* accent this stat uses. Matches the design's
  // tint per reading: moisture = good (green), temperature = warn (amber),
  // humidity = sky (blue), vpd = primary (green, zone-brand color).
  variant:  { type: String, default: 'primary' },
  // Only VPD shows a qualitative pill in the design; the others rely on the
  // header's zone-status badge instead of repeating a pill on every box.
  showPill: { type: Boolean, default: false },
  okLabel:  { type: String, default: 'NORMAL' },
})

const displayValue = computed(() =>
  props.value === null ? '—' : String(props.value)
)

// Explicit pastel tints in light mode (10% theme-token opacity reads as
// flat gray, not a real tint) with a theme-token fallback in dark mode.
const VARIANT_MAP = {
  good:    { bg: 'bg-[#eafaf1] dark:bg-garden-good/15',    text: 'text-garden-good' },
  warn:    { bg: 'bg-[#fff6e6] dark:bg-garden-warn/15',    text: 'text-garden-warn' },
  sky:     { bg: 'bg-[#eef7ff] dark:bg-garden-sky/15',     text: 'text-garden-sky' },
  primary: { bg: 'bg-garden-void',                         text: 'text-garden-primary' },
}

const bgClass    = computed(() => VARIANT_MAP[props.variant]?.bg   ?? VARIANT_MAP.primary.bg)
const valueClass = computed(() => VARIANT_MAP[props.variant]?.text ?? VARIANT_MAP.primary.text)

const STATUS_MAP = {
  ok:      { class: 'bg-garden-good/15 text-garden-good' },
  low:     { class: 'bg-garden-warn/15 text-garden-warn' },
  high:    { class: 'bg-garden-danger/15 text-garden-danger' },
  unknown: { class: 'bg-garden-base text-garden-dim' },
}

const pillText  = computed(() => {
  if (props.status === 'ok') return props.okLabel
  return { low: 'LOW', high: 'HIGH', unknown: 'NO DATA' }[props.status] ?? 'NO DATA'
})
const pillClass = computed(() => STATUS_MAP[props.status]?.class ?? STATUS_MAP.unknown.class)
</script>