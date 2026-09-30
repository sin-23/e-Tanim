<template>
  <article
    class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden transition-colors duration-200"
  >
    <div class="p-5">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3 min-w-0">
          <span class="text-2xl">{{ r.emoji }}</span>
          <div class="min-w-0">
            <div class="text-sm font-semibold text-garden-text tracking-tight truncate">{{ r.label }}</div>
            <div class="text-[10px] text-garden-dim mt-0.5">{{ r.subtitle }}</div>
          </div>
        </div>
        <span
          class="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0"
          :style="badgeStyle(r)"
        >{{ badgeText(r) }}</span>
      </div>

      <!-- Loading skeleton -->
      <div v-if="r.loading" class="w-44 h-44 mx-auto rounded-full bg-garden-base animate-pulse" />

      <template v-else>
        <!-- Gauge -->
        <div class="relative w-44 h-44 mx-auto">
          <svg viewBox="0 0 160 160" class="w-full h-full">
            <circle cx="80" cy="80" r="70" fill="none" stroke="rgb(var(--garden-border))" stroke-width="14" />
            <circle
              v-if="r.levelPct !== null"
              cx="80" cy="80" r="70" fill="none"
              :stroke="gaugeColor(r)"
              stroke-width="14"
              stroke-linecap="round"
              :stroke-dasharray="`${circ * (r.levelPct / 100)} ${circ - circ * (r.levelPct / 100)}`"
              style="transform: rotate(-90deg); transform-origin: center"
            />
            <text x="80" y="76" text-anchor="middle" font-size="28" font-weight="800" class="fill-garden-text" font-family="DM Mono, monospace">
              {{ r.levelPct !== null ? r.levelPct : '—' }}
            </text>
            <text v-if="r.levelPct !== null" x="80" y="96" text-anchor="middle" font-size="14" font-weight="600" class="fill-garden-dim" font-family="Nunito, sans-serif">%</text>
          </svg>
        </div>

        <!-- Linear bar with low-threshold marker -->
        <div class="mt-4 space-y-1.5">
          <div class="relative h-4 bg-garden-base rounded-full overflow-hidden" role="progressbar"
               :aria-valuenow="r.levelPct ?? 0" aria-valuemin="0" aria-valuemax="100" :aria-label="`${r.label} level`">
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{ width: `${r.levelPct ?? 0}%`, backgroundColor: r.levelPct === null ? 'rgb(var(--garden-muted))' : gaugeColor(r) }"
            />
            <div class="absolute top-0 bottom-0 w-px bg-garden-text/30" :style="{ left: `${RESERVOIR_LOW_PCT}%` }" />
          </div>
          <div class="flex justify-between text-[10px]">
            <span class="text-garden-dim">Low at ≤ {{ RESERVOIR_LOW_PCT }}%</span>
            <span class="font-mono" :style="{ color: r.levelPct !== null ? gaugeColor(r) : undefined }" :class="r.levelPct === null ? 'text-garden-dim' : ''">
              {{ r.levelPct !== null ? `${r.levelPct}%` : '—' }}
            </span>
          </div>
        </div>

        <p class="mt-3 text-[11px]" :style="r.low ? { color: COLORS.danger, fontWeight: 600 } : {}" :class="!r.low ? 'text-garden-dim' : ''">
          <template v-if="r.error">{{ r.error }}</template>
          <template v-else-if="r.low">Low level. Refill soon — pumps on this tank may be interlocked.</template>
          <template v-else>Reading is current.</template>
        </p>

        <div class="mt-3 flex items-center justify-between text-[10px] pt-3 border-t border-garden-border">
          <span class="text-garden-dim">Last update</span>
          <span class="font-mono text-garden-text">{{ lastUpdated(r) }}</span>
        </div>
      </template>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { RESERVOIR_LOW_PCT } from '@/composables/useReservoirs'

const props = defineProps({
  reservoir: { type: Object, required: true },
})
const r = computed(() => props.reservoir)

const circ = 2 * Math.PI * 70

// Fixed hex, taken directly from the design file's `:root` tokens.
// The design never re-tints these accent/status colors for dark mode —
// only neutrals (background/border/text) change — so these stay constant
// in both themes instead of running through the app's dark-shifted
// garden-sky/garden-earth/garden-danger CSS variables.
const COLORS = {
  water: '#3b9dd2',
  fertilizer: '#8b5e3c',
  danger: '#ef4444',
}

function baseColor(r) {
  return r.id === 'water' ? COLORS.water : COLORS.fertilizer
}

function gaugeColor(r) {
  if (r.low) return COLORS.danger
  return baseColor(r)
}

function badgeText(r) {
  if (r.loading) return 'SYNCING'
  if (r.error || r.levelPct === null) return 'NO DATA'
  if (r.low) return 'LOW'
  return 'SUFFICIENT'
}

function badgeStyle(r) {
  if (r.loading || r.error || r.levelPct === null) {
    return { backgroundColor: 'rgb(var(--garden-base))', color: 'rgb(var(--garden-dim))', borderColor: 'rgb(var(--garden-border))' }
  }
  const color = r.low ? COLORS.danger : '#22c55e'
  return { backgroundColor: `${color}26`, color, borderColor: `${color}66` }
}

function lastUpdated(r) {
  if (!r.updatedAt) return '—'
  const d = new Date(r.updatedAt)
  const time = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString()
    ? `${time} today`
    : `${time}, ${d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`
}
</script>