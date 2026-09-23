<template>
  <div class="p-4 lg:p-6 space-y-6 pb-12">

    <!-- Environmental Sensors -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in" style="animation-delay:100ms">

      <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4 lg:p-5 lg:col-span-1">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-garden-text tracking-tight flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
            </svg>
            Environmental Sensors
          </h2>
        </div>

        <div class="space-y-3">
          <!-- Temperature -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-garden-warn/10 border-garden-warn/30">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-garden-warn/20 flex items-center justify-center flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-garden-text">Temperature</div>
                <div class="text-[10px] text-garden-dim">Ambient air</div>
              </div>
            </div>
            <span class="text-lg font-medium text-garden-warn">
              {{ averages.temperature !== null ? `${celsiusToDisplay(averages.temperature)}${unitLabel}` : '—' }}
            </span>
          </div>

          <!-- Humidity -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-garden-sky/10 border-garden-sky/30">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-garden-sky/15 flex items-center justify-center flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-garden-text">Humidity</div>
                <div class="text-[10px] text-garden-dim">Relative humidity</div>
              </div>
            </div>
            <span class="text-lg font-medium text-garden-sky">
              {{ averages.humidity !== null ? `${averages.humidity}%` : '—' }}
            </span>
          </div>

          <!-- Soil moisture -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-garden-earth/10 border-garden-earth/30">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-garden-warn/20 flex items-center justify-center flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5e3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-garden-text">Soil Moisture</div>
                <div class="text-[10px] text-garden-dim">Capacitive probe (avg.)</div>
              </div>
            </div>
            <span class="text-lg font-medium text-garden-earth">
              {{ averages.moisture !== null ? `${averages.moisture}%` : '—' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Irrigation Circuit Summary (read-only — controls live on the Irrigation page) -->
      <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4 lg:p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-garden-text tracking-tight flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b9dd2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
            Irrigation &amp; Fertilization
          </h2>
          <span class="text-[10px] font-semibold text-garden-dim bg-garden-base px-2 py-1 rounded-full">4 Circuits</span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="c in circuits"
            :key="c.id"
            class="flex items-center justify-between p-3 rounded-xl border"
            :class="c.relay
              ? 'bg-garden-danger/10 border-garden-danger/30'
              : 'bg-garden-base border-garden-border'"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-lg">{{ c.emoji }}</span>
              <div>
                <div class="text-xs font-medium text-garden-text">{{ c.title }}</div>
                <div class="text-[10px] text-garden-dim">{{ c.subtitle }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                :class="c.relay
                  ? 'bg-garden-danger/15 text-garden-danger border-garden-danger/40'
                  : 'bg-garden-base text-garden-dim border-garden-border'"
              >{{ c.relay ? 'FORCED ON' : 'AUTO' }}</span>
              <div class="w-2 h-2 rounded-full" :class="c.relay ? 'bg-garden-good' : 'bg-garden-muted'" />
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-garden-border flex items-center justify-between gap-3">
          <p class="text-[11px] text-garden-dim">
            {{ activePumpMessage }}
          </p>
          <router-link
            to="/irrigation"
            class="px-3 py-1.5 rounded-xl bg-garden-primary text-white text-xs font-medium hover:bg-[#246040] transition-colors flex-shrink-0"
          >
            Manage →
          </router-link>
        </div>
      </div>

    </section>

    <!-- Reservoir Levels & low-level alert -->
    <section class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4 lg:p-5 animate-fade-in" style="animation-delay:150ms">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-garden-text tracking-tight flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b9dd2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
          Reservoir Levels
        </h2>
        <span class="text-[10px] font-semibold text-garden-dim bg-garden-base px-2 py-1 rounded-full">Low at ≤ 30%</span>
      </div>

      <div
        v-if="lowReservoirs.length"
        role="alert"
        class="mb-3 flex items-start gap-2 p-3 rounded-xl bg-garden-danger/10 border border-garden-danger/40 text-xs text-garden-danger font-medium"
      >
        <span aria-hidden="true">⚠️</span>
        <span>Refill needed: {{ lowReservoirs.map(r => r.label).join(' and ') }} {{ lowReservoirs.length > 1 ? 'are' : 'is' }} at or below 30%.</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ReservoirCard v-for="r in reservoirs" :key="r.id" :reservoir="r" />
      </div>
    </section>

    <!-- Harvest Maturity (AI detections from the Mini PC) -->
    <section class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4 lg:p-5 animate-fade-in" style="animation-delay:200ms">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-garden-text tracking-tight flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d7a4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
          Harvest Maturity
        </h2>
        <span
          class="text-[10px] font-semibold px-2 py-1 rounded-full border"
          :class="totalRipe > 0
            ? 'bg-garden-good/15 text-garden-good border-garden-good/40'
            : 'bg-garden-base text-garden-dim border-garden-border'"
        >{{ totalRipe > 0 ? `${totalRipe} ripe` : 'None ripe yet' }}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <DetectionCard v-for="d in detections" :key="d.id" :detection="d" />
      </div>
    </section>

    <!-- Activity Log -->
    <section class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4 lg:p-5 max-w-2xl">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-garden-text tracking-tight flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d7a4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Activity Log
        </h2>
      </div>
      <div v-if="!activityLogLoaded" class="space-y-1">
        <div v-for="i in 4" :key="i" class="flex items-start gap-2.5 p-2.5">
          <div class="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-garden-border animate-pulse" />
          <div class="min-w-0 flex-1 space-y-1.5">
            <div class="h-3 w-2/3 rounded bg-garden-border animate-pulse" />
            <div class="h-2.5 w-1/3 rounded bg-garden-border animate-pulse" />
          </div>
        </div>
      </div>
      <div v-else-if="activityLog.length === 0" class="text-center py-8 text-xs text-garden-dim">
        No activity yet — pump events, schedule changes, and detections will appear here as they happen.
      </div>
      <div v-else class="space-y-1 overflow-y-auto max-h-72 pr-1">
        <div
          v-for="log in activityLog"
          :key="log.id"
          class="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-garden-base transition-colors"
        >
          <div class="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ backgroundColor: log.color }" />
          <div class="min-w-0 flex-1">
            <div class="text-xs font-semibold text-garden-text leading-snug">{{ log.message }}</div>
            <div class="text-[10px] text-garden-dim mt-0.5">
              {{ formatLogTime(log.timestamp) }}<span v-if="log.by"> · by {{ log.by }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { db } from '@/firebase'
import { useActivityFeed } from '@/composables/useActivityLog'
import { useTempUnit } from '@/composables/useTempUnit'
import { useReservoirs } from '@/composables/useReservoirs'
import ReservoirCard from '@/components/ReservoirCard.vue'
import { useDetections } from '@/composables/useDetections'
import DetectionCard from '@/components/DetectionCard.vue'

const { unitLabel, celsiusToDisplay } = useTempUnit()
const { reservoirs, lowReservoirs } = useReservoirs()
const { detections, totalRipe } = useDetections()

const today = computed(() =>
  new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
)

const averages = ref({ moisture: null, temperature: null, humidity: null })
let unsubAvg   = null

import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
  const avgRef = dbRef(db, 'averages')
  const unsub  = onValue(avgRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      averages.value = {
        moisture:    data.moisture    ?? null,
        temperature: data.temperature ?? null,
        humidity:    data.humidity    ?? null,
      }
    }
  })
  unsubAvg = () => off(avgRef, 'value', unsub)
})

onUnmounted(() => { if (unsubAvg) unsubAvg() })

// ── Live relay state (read-only summary — feeds the circuit list only;
// actual logging now happens at the point of action — see RelayControl.vue,
// useRelayAutoOff.js, and FertScheduleCard.vue — via logActivity(), not here) ─
const RELAY_CIRCUITS = [
  { id: 1, path: 'control/relay_lowland',  title: 'Lowland Irrigation',  subtitle: 'Tomato, Eggplant',      emoji: '💧' },
  { id: 2, path: 'control/relay_highland', title: 'Highland Irrigation', subtitle: 'Bell Pepper',           emoji: '⛰️' },
  { id: 3, path: 'control/relay_fert',     title: 'Fertilizer',          subtitle: 'Shared line, all crops', emoji: '🌿' },
  { id: 4, path: 'control/relay_mist',     title: 'Highland Misting',    subtitle: 'Bell Pepper cooling',   emoji: '🌫️' },
]
const relayState = ref({})
const relayUnsubs = []

import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
  RELAY_CIRCUITS.forEach(({ id, path }) => {
    const r = dbRef(db, path)
    const cb = onValue(r, (snapshot) => { relayState.value = { ...relayState.value, [id]: snapshot.val() === true } })
    relayUnsubs.push(() => off(r, 'value', cb))
  })
})

onUnmounted(() => relayUnsubs.forEach(fn => fn()))

const circuits = computed(() =>
  RELAY_CIRCUITS.map(c => ({ ...c, relay: relayState.value[c.id] === true }))
)

const activePumpMessage = computed(() => {
  const active = circuits.value.filter(c => c.relay)
  if (active.length === 0) return 'No pumps currently active.'
  return `${active.map(c => c.title).join(', ')} currently active.`
})

// ── Activity log — shared, persistent feed (see useActivityLog.js) ───────────
const { entries: activityLog, loaded: activityLogLoaded } = useActivityFeed(25)

function formatLogTime(timestamp) {
  const d = new Date(timestamp)
  const isToday = d.toDateString() === new Date().toDateString()
  const time = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return isToday ? `${time} today` : `${time}, ${d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`
}
</script>