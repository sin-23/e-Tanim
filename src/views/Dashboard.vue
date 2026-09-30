<template>
  <div class="p-4 lg:p-6 space-y-5 pb-12">
    <!-- ───────────────── ZONE STATUS ───────────────── -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-garden-text flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d7a4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Zone Status
        </h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ZoneCard
          v-for="zone in zones"
          :key="zone.id"
          :zone="zone"
        />
      </div>
    </section>

    <!-- ───────────────── SYSTEM CONTROLS ───────────────── -->
    <section>
      <h2 class="text-sm font-bold text-garden-text mb-3 flex items-center gap-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b9dd2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
        System Controls
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ControlStatusCard
          title="Irrigation"
          subtitle="Automatic soil moisture + VPD control"
          color="#3b9dd2"
          :status="irrigationStatus"
          :active="irrigationActive"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        </ControlStatusCard>

        <ControlStatusCard
          title="Fertilization"
          subtitle="Shared line, all crops"
          color="#8b5e3c"
          :status="fertilizationStatus"
          :active="circuits.find(c => c.id === 3)?.relay ?? false"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </ControlStatusCard>

        <ControlStatusCard
          title="Misting"
          subtitle="Highland · Temperature / Humidity"
          color="#3b9dd2"
          :status="mistingStatus"
          :active="misting.manualOn.value || misting.autoConditionsMet.value"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
          </svg>
        </ControlStatusCard>
      </div>
    </section>

    <!-- ───────────────── RESERVOIR LEVELS ───────────────── -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-garden-text flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b9dd2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
          Reservoir Levels
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ReservoirCard v-for="r in reservoirs" :key="r.id" :reservoir="r" compact />
      </div>
    </section>

    <!-- ───────────────── HARVEST MATURITY ───────────────── -->
    <!-- Real feature (AI detections from the Mini PC) — not in the design file, kept since it's live data, not mock. -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-garden-text flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d7a4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
          Harvest Maturity
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <DetectionCard v-for="d in detections" :key="d.id" :detection="d" :show-fruit-log="false" />
      </div>
    </section>

    <!-- ───────────────── ACTIVITY LOG & ALERTS ───────────────── -->
    <!-- Titles sit outside the cards (like every other section); the two columns stay side by side. -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- Activity Log: compact version of the Activity Log page -->
      <div class="flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-bold text-garden-text flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d7a4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Activity Log
          </h2>
        </div>

        <!-- The Activity Log page itself, in compact mode, inside a scrolling container -->
        <div class="flex-1 bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4 overflow-y-auto max-h-[28rem]">
          <ActivityLogView embedded />
        </div>
      </div>

      <!-- Alerts -->
      <div class="flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-garden-text flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Alerts
            </h2>
            <span
              v-if="unreadAlertCount > 0"
              class="w-5 h-5 rounded-full bg-garden-danger text-white text-[9px] font-bold flex items-center justify-center"
            >{{ unreadAlertCount }}</span>
          </div>
          <button
            v-if="unreadAlertCount > 0"
            class="text-[10px] font-semibold text-garden-primary hover:underline"
            @click="markAllAlertsRead"
          >Mark all read</button>
        </div>

        <div class="flex-1 bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4">
          <p v-if="alertsLoading" class="text-xs text-garden-dim text-center py-8">Loading…</p>
          <p v-else-if="alertsError" class="text-xs text-garden-danger text-center py-8">{{ alertsError }}</p>
          <p v-else-if="alerts.length === 0" class="text-xs text-garden-dim text-center py-8">No alerts yet.</p>

          <div v-else class="space-y-2 overflow-y-auto max-h-80 pr-1">
            <div
              v-for="a in alerts"
              :key="a.id"
              class="flex items-start gap-2.5 p-3 rounded-xl border transition-all duration-200"
              :class="[
                a.tone === 'danger' ? 'bg-garden-danger/10 border-garden-danger/30' : 'bg-garden-good/10 border-garden-good/30',
                a.unread ? '' : 'opacity-50',
              ]"
            >
              <span class="text-base flex-shrink-0 mt-0.5">{{ a.emoji }}</span>
              <div class="min-w-0 flex-1">
                <div class="text-xs font-semibold leading-snug" :class="a.tone === 'danger' ? 'text-garden-danger' : 'text-garden-good'">
                  {{ a.message }}
                </div>
                <div class="text-[10px] text-garden-dim mt-0.5">{{ formatLogTime(a.createdAt) }}</div>
              </div>
              <div v-if="a.unread" class="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" :class="a.tone === 'danger' ? 'bg-garden-danger' : 'bg-garden-good'" />
            </div>
          </div>
        </div>
      </div>

    </section>

  </div>
</template>

<script setup>
import { computed, ref, onUnmounted } from 'vue'
import { db } from '@/firebase'
import ActivityLogView from '@/views/ActivityLogView.vue'
import { useTempUnit } from '@/composables/useTempUnit'
import { useReservoirs } from '@/composables/useReservoirs'
import ReservoirCard from '@/components/ReservoirCard.vue'
import { useDetections } from '@/composables/useDetections'
import DetectionCard from '@/components/DetectionCard.vue'
import { useSensorData } from '@/composables/useSensorData'
import { useMisting } from '@/composables/useMisting'
import { useNotifications } from '@/composables/useNotifications'
import ControlStatusCard from '@/components/ControlStatusCard.vue'
import ZoneCard from '@/components/ZoneCard.vue'

const { unitLabel, celsiusToDisplay } = useTempUnit()
const { reservoirs, lowReservoirs } = useReservoirs()
const { zones } = useSensorData()
const { detections, totalRipe } = useDetections()
const misting = useMisting()
// The Dashboard shows every notification. Dismissing (X) is done in the navbar bell only.
const {
  notifications: alerts,
  unreadCount: unreadAlertCount,
  loading: alertsLoading,
  error: alertsError,
  markAllRead: markAllAlertsRead,
} = useNotifications()

// ── VPD / moisture status bands — ported from the design file's
// getVPDStatus()/getMoistureStatus() so the labels and thresholds match. ────
function vpdStatus(vpd) {
  if (vpd < 0.4)  return { label: 'Low',     color: '#1d4ed8' }
  if (vpd <= 1.2) return { label: 'Optimal', color: '#15803d' }
  if (vpd <= 2.0) return { label: 'High',    color: '#92400e' }
  return { label: 'Stress', color: '#991b1b' }
}

// ── Live relay state (read-only summary — feeds the System Controls cards;
// actual logging happens at the point of action — see RelayControl.vue,
// useRelayAutoOff.js, and FertScheduleCard.vue). ─────────────────────────────
const RELAY_CIRCUITS = [
  { id: 1, path: 'control/relay_lowland' },
  { id: 2, path: 'control/relay_highland' },
  { id: 3, path: 'control/relay_fert' },
  { id: 4, path: 'control/relay_mist' },
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

const waterLow = computed(() => lowReservoirs.value.some(r => r.id === 'water'))
const fertilizerLow = computed(() => lowReservoirs.value.some(r => r.id === 'fertilizer'))

const irrigationActive = computed(() => (circuits.value.find(c => c.id === 1)?.relay || circuits.value.find(c => c.id === 2)?.relay) ?? false)
const irrigationStatus = computed(() => waterLow.value ? 'LOCKED' : irrigationActive.value ? 'RUNNING' : 'AUTO')

const fertilizationStatus = computed(() => {
  if (fertilizerLow.value) return 'LOCKED'
  return circuits.value.find(c => c.id === 3)?.relay ? 'RUNNING' : 'AUTO'
})

const mistingStatus = computed(() => {
  if (waterLow.value) return 'LOCKED'
  if (misting.manualOn.value) return 'RUNNING'
  return misting.autoConditionsMet.value ? 'RUNNING' : 'AUTO'
})

function formatLogTime(timestamp) {
  const d = new Date(timestamp)
  const isToday = d.toDateString() === new Date().toDateString()
  const time = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return isToday ? `${time} today` : `${time}, ${d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`
}
</script>