<template>
  <article
    class="rounded-xl border p-4 transition-colors"
    :class="reservoir.low && !unavailable
      ? 'bg-garden-danger/10 border-garden-danger/40'
      : 'bg-garden-base border-garden-border'"
  >
    <div class="flex items-center justify-between gap-2 mb-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="text-lg">{{ reservoir.emoji }}</span>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-garden-text truncate">{{ reservoir.label }}</div>
          <div class="text-[10px] text-garden-dim">{{ reservoir.subtitle }}</div>
        </div>
      </div>

      <span
        class="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0"
        :class="badge.classes"
      >{{ badge.text }}</span>
    </div>

    <div v-if="reservoir.loading" class="h-3 rounded-full bg-garden-border animate-pulse" />

    <template v-else>
      <div class="flex items-baseline justify-between mb-1.5">
        <span class="text-2xl font-medium" :class="unavailable ? 'text-garden-dim' : levelTextClass">
          {{ reservoir.levelPct !== null ? `${reservoir.levelPct}%` : '—' }}
        </span>
        <span class="text-[10px] text-garden-dim">Low at ≤ {{ RESERVOIR_LOW_PCT }}%</span>
      </div>

      <!-- Level bar with the 30% low marker -->
      <div
        class="relative h-3 rounded-full bg-garden-border overflow-hidden"
        role="progressbar"
        :aria-valuenow="reservoir.levelPct ?? 0"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`${reservoir.label} level`"
      >
        <div
          class="h-full rounded-full transition-all duration-700"
          :class="unavailable ? 'bg-garden-muted' : barClass"
          :style="{ width: `${reservoir.levelPct ?? 0}%` }"
        />
        <div
          class="absolute top-0 bottom-0 w-px bg-garden-text/40"
          :style="{ left: `${RESERVOIR_LOW_PCT}%` }"
        />
      </div>

      <p class="mt-2 text-[10px]" :class="reservoir.low && !unavailable ? 'text-garden-danger font-medium' : 'text-garden-dim'">
        <template v-if="reservoir.error">{{ reservoir.error }}</template>
        <template v-else-if="reservoir.low">Low level. Refill soon, pumps on this tank may be interlocked.</template>
        <template v-else-if="reservoir.stale">No update for over 3 minutes. Last: {{ lastUpdated }}</template>
        <template v-else>Updated {{ lastUpdated }}</template>
      </p>
    </template>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { RESERVOIR_LOW_PCT } from '@/composables/useReservoirs'

const props = defineProps({
  reservoir: { type: Object, required: true },
})

// No usable reading: still loading, errored, or nothing received yet.
const unavailable = computed(() => props.reservoir.loading || !!props.reservoir.error || props.reservoir.levelPct === null)

const levelTextClass = computed(() => {
  if (props.reservoir.low) return 'text-garden-danger'
  return props.reservoir.stale ? 'text-garden-warn' : 'text-garden-text'
})

const barClass = computed(() => {
  if (props.reservoir.low) return 'bg-garden-danger'
  if (props.reservoir.levelPct <= 50) return 'bg-garden-warn'
  return 'bg-garden-good'
})

const badge = computed(() => {
  const r = props.reservoir
  if (r.loading)             return { text: 'SYNCING', classes: 'bg-garden-base text-garden-dim border-garden-border' }
  if (r.error || r.levelPct === null) return { text: 'NO DATA', classes: 'bg-garden-base text-garden-dim border-garden-border' }
  if (r.low)                 return { text: 'LOW',     classes: 'bg-garden-danger/15 text-garden-danger border-garden-danger/40' }
  if (r.stale)               return { text: 'STALE',   classes: 'bg-garden-warn/15 text-garden-warn border-garden-warn/40' }
  return { text: 'OK', classes: 'bg-garden-good/15 text-garden-good border-garden-good/40' }
})

const lastUpdated = computed(() => {
  const t = props.reservoir.updatedAt
  if (!t) return '—'
  const d = new Date(t)
  const time = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString()
    ? `${time} today`
    : `${time}, ${d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`
})
</script>