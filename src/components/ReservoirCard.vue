<template>
  <article
    class="bg-garden-surface rounded-2xl border shadow-sm overflow-hidden transition-colors duration-200"
    :class="compact && r.low ? 'border-garden-danger/40 bg-garden-danger/10' : 'border-garden-border'"
  >
    <!-- Compact (Dashboard): label + percentage + thin bar, as in the Figma dashboard -->
    <div v-if="compact" class="p-4">
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-lg">{{ r.emoji }}</span>
          <div class="min-w-0">
            <div class="text-xs font-semibold text-garden-text truncate">{{ r.label }}</div>
            <div class="text-[9px] text-garden-dim">{{ r.subtitle }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border" :style="badgeStyle(r)">{{ badgeText(r) }}</span>
          <span
            class="text-xl font-extrabold font-mono"
            :style="{ color: r.levelPct !== null ? gaugeColor(r) : undefined }"
            :class="r.levelPct === null ? 'text-garden-dim' : ''"
          >{{ r.levelPct !== null ? `${r.levelPct}%` : '—' }}</span>
        </div>
      </div>

      <div v-if="r.loading" class="h-2 rounded-full bg-garden-base animate-pulse" />
      <div v-else class="relative h-2 bg-garden-base rounded-full overflow-hidden" role="progressbar"
           :aria-valuenow="r.levelPct ?? 0" aria-valuemin="0" aria-valuemax="100" :aria-label="`${r.label} level`">
        <div
          class="h-full rounded-full transition-all duration-700"
          :style="{ width: `${r.levelPct ?? 0}%`, backgroundColor: r.levelPct === null ? 'rgb(var(--garden-muted))' : gaugeColor(r) }"
        />
        <div class="absolute top-0 bottom-0 w-px bg-garden-text/30" :style="{ left: `${r.lowPct}%` }" />
      </div>

      <p v-if="r.error" class="mt-2 text-[11px] text-garden-dim">{{ r.error }}</p>
      <p v-else-if="r.low" class="mt-2 text-[11px] font-semibold" :style="{ color: COLORS.danger }">
        Low level. Refill soon — pumps on this tank may be interlocked.
      </p>
    </div>

    <div v-else class="p-5">
      <div class="flex items-center justify-between mb-5 gap-2">
        <!-- Low-level alert settings (replaces the title, which now sits above the card) -->
        <button
          class="flex items-center gap-2 px-2.5 py-1.5 -ml-2 rounded-lg text-garden-dim hover:bg-garden-base hover:text-garden-primary transition-colors min-w-0"
          title="Adjust low-level alert"
          @click="openSettings"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span class="text-[11px] font-semibold truncate">Alert at ≤ {{ r.lowPct }}%</span>
        </button>
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
            <div class="absolute top-0 bottom-0 w-px bg-garden-text/30" :style="{ left: `${r.lowPct}%` }" />
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between text-[10px] pt-3 border-t border-garden-border">
          <p class="text-[11px]" :style="r.low ? { color: COLORS.danger, fontWeight: 600 } : {}" :class="!r.low ? 'text-garden-dim' : ''">
            <template v-if="r.error">{{ r.error }}</template>
            <template v-else-if="r.low">Low level. Refill soon — pumps on this tank may be interlocked.</template>
            <template v-else>Reservoir levels sufficient for continued use.</template>
          </p>
          <span class="text-garden-dim">Last update {{ lastUpdated(r) }}</span>
        </div>
      </template>
    </div>
    <!-- Low-level alert settings modal -->
    <Teleport to="body">
      <div v-if="showSettings" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click="closeSettings">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div class="relative bg-garden-surface rounded-2xl shadow-2xl w-full max-w-xs border border-garden-border z-10" @click.stop>
          <div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-garden-border">
            <div>
              <div class="text-[10px] font-medium text-garden-dim uppercase tracking-widest mb-0.5">Settings</div>
              <h3 class="text-base font-semibold text-garden-text">{{ r.label }} Alert</h3>
            </div>
            <button
              class="w-8 h-8 rounded-full bg-garden-base flex items-center justify-center text-garden-dim hover:bg-garden-border transition-colors flex-shrink-0"
              @click="closeSettings"
            >✕</button>
          </div>

          <div class="p-5 space-y-3">
            <label class="text-xs font-semibold text-garden-text block" :for="`low-pct-${r.id}`">
              Notify me when the level drops to or below (%)
            </label>
            <input
              :id="`low-pct-${r.id}`"
              v-model.number="editPct"
              type="number" :min="RESERVOIR_LOW_MIN" :max="RESERVOIR_LOW_MAX" step="1"
              class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary"
              @keyup.enter="save"
            />
            <p class="text-[11px] text-garden-dim leading-snug">
              Allowed range {{ RESERVOIR_LOW_MIN }}–{{ RESERVOIR_LOW_MAX }}%. Default is {{ RESERVOIR_LOW_PCT }}%.
            </p>
            <p v-if="saveError" class="text-[11px] font-semibold" :style="{ color: COLORS.danger }">{{ saveError }}</p>
          </div>

          <div class="flex gap-2 px-5 pb-5">
            <button class="px-3 py-2.5 rounded-xl bg-garden-warn text-white font-medium text-xs hover:opacity-85 transition" :disabled="saving" @click="resetToDefault">↺ Reset</button>
            <button class="flex-1 py-2.5 rounded-xl border border-garden-border bg-garden-surface text-garden-text font-medium text-sm hover:opacity-80 transition" @click="closeSettings">Cancel</button>
            <button class="flex-1 py-2.5 rounded-xl text-white font-medium text-sm hover:opacity-90 transition disabled:opacity-60" :style="{ backgroundColor: baseColor(r) }" :disabled="saving" @click="save">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RESERVOIR_LOW_PCT, RESERVOIR_LOW_MIN, RESERVOIR_LOW_MAX } from '@/composables/useReservoirs'

const props = defineProps({
  reservoir: { type: Object, required: true },
  // Smaller card used on the Dashboard; the Reservoir page uses the full gauge.
  compact: { type: Boolean, default: false },
})
// Emitted with { id, pct, done, fail }; the Reservoir page does the actual save.
const emit = defineEmits(['save-threshold'])
const r = computed(() => props.reservoir)

// ── Low-level alert settings ──
const showSettings = ref(false)
const editPct = ref(RESERVOIR_LOW_PCT)
const saving = ref(false)
const saveError = ref('')

function openSettings() {
  editPct.value = r.value.lowPct ?? RESERVOIR_LOW_PCT
  saveError.value = ''
  showSettings.value = true
}
function closeSettings() { showSettings.value = false }
function resetToDefault() { editPct.value = RESERVOIR_LOW_PCT }

function save() {
  const n = Number(editPct.value)
  if (!Number.isInteger(n) || n < RESERVOIR_LOW_MIN || n > RESERVOIR_LOW_MAX) {
    saveError.value = `Enter a whole number from ${RESERVOIR_LOW_MIN} to ${RESERVOIR_LOW_MAX}.`
    return
  }
  saving.value = true
  saveError.value = ''
  emit('save-threshold', {
    id: r.value.id,
    pct: n,
    done: () => { saving.value = false; showSettings.value = false },
    fail: (err) => { saving.value = false; saveError.value = err?.message || 'Could not save. Check your connection.' },
  })
}

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