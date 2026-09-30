<template>
  <div class="p-4 lg:p-6 space-y-5 pb-12">
    <!-- Tab bar, matching the Figma design -->
    <div class="flex gap-1 bg-garden-base rounded-2xl p-1">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-150"
        :class="tab === t.id
          ? 'bg-garden-surface text-garden-text shadow-sm'
          : 'text-garden-dim hover:text-garden-text'"
        @click="tab = t.id"
      >
        <span :class="tab === t.id ? 'text-garden-primary' : ''" v-html="t.icon" />
        {{ t.label }}
      </button>
    </div>

    <!-- ───────────────── IRRIGATION ───────────────── -->
    <div v-if="tab === 'irrigation'" class="space-y-5">
      <!-- Water reservoir warning -->
      <div v-if="waterLow" class="flex items-center gap-3 p-4 rounded-2xl bg-garden-danger/10 border border-garden-danger/40">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <div class="text-xs font-bold text-garden-danger">Water Reservoir Locked</div>
          <p class="text-[11px] text-garden-danger/80 font-medium">
            Water level at or below its low-level threshold. Automatic irrigation and misting are suspended
            until the reservoir is refilled.
          </p>
        </div>
      </div>

      <!-- Zone Status -->
      <div>
        <h2 class="text-sm font-bold text-garden-text mb-3 flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d7a4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Zone Status
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ZoneCard
            v-for="zone in zones"
            :key="zone.id"
            :zone="zone"
            :pump-on="zone.id === 'lowland' ? lowlandPumpOn : highlandPumpOn"
          />
        </div>
      </div>

      <!-- Pump Override Controls -->
      <div>
        <h2 class="text-sm font-bold text-garden-text mb-3 flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b9dd2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
          Pump Override Controls
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RelayControl
            :current-moisture="lowland?.sensors.moisture ?? null"
            :current-temperature="lowland?.sensors.temperature ?? null"
            :current-humidity="lowland?.sensors.humidity ?? null"
            :current-vpd="lowland?.vpd ?? null"
            :readonly="false"
            controlPath="control/relay_lowland"
            title="Lowland Irrigation (Tomato, Eggplant)"
            :show-threshold-settings="true"
            :pump-number="1"
          />
          <RelayControl
            :current-moisture="highland?.sensors.moisture ?? null"
            :current-temperature="highland?.sensors.temperature ?? null"
            :current-humidity="highland?.sensors.humidity ?? null"
            :current-vpd="highland?.vpd ?? null"
            :readonly="false"
            controlPath="control/relay_highland"
            title="Highland Irrigation (Bell Pepper)"
            :show-threshold-settings="true"
            :pump-number="2"
          />
        </div>
      </div>

      <!-- Per-Circuit Sensor Detail -->
      <div>
        <h2 class="text-sm font-bold text-garden-text mb-3 flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
          Individual Crop Sensor Readings
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="crop in perCropRows"
            :key="crop.nodeId"
            class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden"
          >
            <div class="p-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-lg">{{ crop.emoji }}</span>
                <div>
                  <div class="font-bold text-sm text-garden-text">{{ crop.label }}</div>
                  <div class="text-[10px] text-garden-dim capitalize">{{ crop.climate }} Zone</div>
                </div>
              </div>

              <div v-if="crop.loading" class="grid grid-cols-2 gap-2">
                <div v-for="i in 4" :key="i" class="h-12 rounded-xl bg-garden-border animate-pulse" />
              </div>
              <p v-else-if="crop.error" class="text-xs text-garden-dim">{{ crop.error }}</p>
              <div v-else class="grid grid-cols-2 gap-2">
                <div
                  v-for="row in crop.rows"
                  :key="row.label"
                  class="p-2 rounded-xl bg-garden-void"
                >
                  <div class="text-[9px] font-bold uppercase tracking-widest text-garden-dim mb-0.5">
                    {{ row.label }}
                  </div>
                  <div class="text-sm font-mono" :style="{ color: row.color }">
                    {{ row.value }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ───────────────── FERTILIZATION ───────────────── -->
    <div v-else-if="tab === 'fertilization'" class="space-y-4">
      <!-- Same two-column layout as Misting; section titles sit outside the cards like the Irrigation tab -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <div class="flex flex-col">
          <h2 class="text-sm font-bold text-garden-text mb-3 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5e3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Fertilizer Schedule
          </h2>
          <FertScheduleCard class="flex-1" :readonly="false" :schedule-active="fertScheduleActive || fertPumpOn" />
        </div>

        <div class="flex flex-col">
          <h2 class="text-sm font-bold text-garden-text mb-3 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5e3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
            Pump Override Controls
          </h2>
          <RelayControl
            class="flex-1"
            :readonly="false"
            controlPath="control/relay_fert"
            title="Fertilization"
            :show-threshold-settings="false"
            :pump-number="3"
          />
        </div>
      </div>
    </div>

    <!-- ───────────────── MISTING ───────────────── -->
    <div v-else class="space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Highland sensor detail, read from the same useMisting() composable
             MistingStatusCard already uses -->
        <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4">
          <div class="flex items-center justify-between gap-2 mb-3">
            <h3 class="text-sm font-bold text-garden-text flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b9dd2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
              Highland Sensor
            </h3>
            <span
            class="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full flex-shrink-0"
            :class="mistingRunning ? 'bg-garden-good/15 text-garden-good' : 'bg-garden-base text-garden-dim'"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="mistingRunning ? 'bg-garden-good animate-pulse' : 'bg-garden-dim'" />
            {{ mistingRunning ? 'Running' : 'Off' }}
          </span>
          </div>

          <div v-if="misting.loading.value" class="grid grid-cols-2 gap-3">
            <div class="h-24 rounded-2xl bg-garden-border animate-pulse" />
            <div class="h-24 rounded-2xl bg-garden-border animate-pulse" />
          </div>

          <div v-else class="grid grid-cols-2 gap-3">
            <div class="p-4 rounded-2xl bg-garden-warn/10 border border-garden-warn/30">
              <div class="text-[10px] font-bold uppercase tracking-widest text-garden-dim mb-1">Temperature</div>
              <div class="text-3xl font-bold font-mono text-garden-warn">
                {{ tempDisplay !== null ? `${tempDisplay}${unitLabel}` : '—' }}
              </div>
              <div class="flex items-center gap-1.5 mt-2">
                <span class="text-[10px] font-medium text-garden-dim">
                  Threshold: {{ celsiusToDisplay(misting.config.value.tempOn) }}{{ unitLabel }}
                </span>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-garden-sky/10 border border-garden-sky/30">
              <div class="text-[10px] font-bold uppercase tracking-widest text-garden-dim mb-1">Humidity</div>
              <div class="text-3xl font-bold font-mono text-garden-sky">
                {{ humidityDisplay ?? '—' }}
              </div>
              <div class="flex items-center gap-1.5 mt-2">
                <span class="text-[10px] font-medium text-garden-dim">
                  Threshold: {{ misting.config.value.humidityOn }} %
                </span>
              </div>
            </div>
          </div>

          <p v-if="misting.sensorErr.value" class="text-[11px] text-garden-dim mt-3">{{ misting.sensorErr.value }}</p>
        </div>

        <!-- Thresholds + manual override: RelayControl (pump 4) already handles
             both the config/misting threshold modal and the manual relay/countdown UI -->
        <RelayControl
          :readonly="false"
          controlPath="control/relay_mist"
          title="Highland Misting"
          :show-threshold-settings="true"
          :pump-number="4"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ZoneCard from '@/components/ZoneCard.vue'
import RelayControl from '@/components/RelayControl.vue'
import FertScheduleCard from '@/components/FertScheduleCard.vue'
import { useSensorData, CROPS, computeVpd } from '@/composables/useSensorData'
import { useMisting } from '@/composables/useMisting'
import { useReservoirs } from '@/composables/useReservoirs'
import { db } from '@/firebase'
import { useTempUnit } from '@/composables/useTempUnit'

const { unitLabel, celsiusToDisplay } = useTempUnit()

const TABS = [
  { id: 'irrigation', label: 'Irrigation', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>' },
  { id: 'fertilization', label: 'Fertilization', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
  { id: 'misting', label: 'Misting', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>' },
]
const tab = ref('irrigation')

// ── Irrigation tab ───────────────────────────────────────────────────────
const { zones } = useSensorData()
const lowland  = computed(() => zones.value.find(z => z.id === 'lowland'))
const highland = computed(() => zones.value.find(z => z.id === 'highland'))

const { lowReservoirs } = useReservoirs()
const waterLow = computed(() => lowReservoirs.value.some(r => r.id === 'water'))

// Per-crop rows (design's "Per-Circuit Sensor Detail"): built from the same
// per-crop sensor data useSensorData() already gathers into zone.crops, plus
// the existing computeVpd() helper applied per crop instead of per zone.
const CROP_COLOR = {
  tomato:      { color: '#dc2626', border: '#fca5a5' },
  eggplant:    { color: '#7c3aed', border: '#c4b5fd' },
  bell_pepper: { color: '#2d7a4f', border: '#86efac' },
}
const perCropRows = computed(() => {
  const allCrops = [...(lowland.value?.crops ?? []), ...(highland.value?.crops ?? [])]
  return CROPS.map(meta => {
    const c = allCrops.find(x => x.nodeId === meta.nodeId)
    const colors = CROP_COLOR[meta.crop]
    if (!c || c.loading) {
      return { ...meta, color: colors.color, borderColor: colors.border, loading: true }
    }
    if (c.error) {
      return { ...meta, color: colors.color, borderColor: colors.border, loading: false, error: c.error }
    }
    const vpd = computeVpd(c.sensors.temperature, c.sensors.humidity)
    return {
      ...meta,
      color: colors.color,
      borderColor: colors.border,
      loading: false,
      rows: [
        { label: 'Soil Moisture', value: c.sensors.moisture !== null ? `${c.sensors.moisture} %` : '—', color: colors.color },
        { label: 'VPD', value: vpd !== null ? `${vpd} kPa` : '—', color: '#2d7a4f' },
        { label: 'Temperature', value: c.sensors.temperature !== null ? `${celsiusToDisplay(c.sensors.temperature)} ${unitLabel.value}` : '—', color: '#d97706' },
        { label: 'Humidity', value: c.sensors.humidity !== null ? `${c.sensors.humidity} %` : '—', color: '#2563eb' },
      ],
    }
  })
})

// ── Fertilization tab ────────────────────────────────────────────────────
// Same derived-state pattern already used by ZoneCard's irrigationState:
// a client-side read of already-loaded data (config/fert_schedule, plus the
// live control/relay_fert flag), not a new Firebase path.
const fertPumpOn = ref(false)
const lowlandPumpOn = ref(false)
const highlandPumpOn = ref(false)
const fertSchedule = ref(null)
let unsubFertRelay = null
let unsubIrrigRelays = null
let unsubFertSchedule = null
let scheduleTick = null

onMounted(() => {
  import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
    const relayRef = dbRef(db, 'control/relay_fert')
    const relayCb  = onValue(relayRef, (s) => { fertPumpOn.value = s.val() === true })
    unsubFertRelay = () => off(relayRef, 'value', relayCb)

    const lowRef = dbRef(db, 'control/relay_lowland')
    const lowCb  = onValue(lowRef, (s) => { lowlandPumpOn.value = s.val() === true })
    const highRef = dbRef(db, 'control/relay_highland')
    const highCb  = onValue(highRef, (s) => { highlandPumpOn.value = s.val() === true })
    unsubIrrigRelays = () => { off(lowRef, 'value', lowCb); off(highRef, 'value', highCb) }

    const schedRef = dbRef(db, 'config/fert_schedule')
    const schedCb  = onValue(schedRef, (s) => { fertSchedule.value = s.val() })
    unsubFertSchedule = () => off(schedRef, 'value', schedCb)
  })
  scheduleTick = setInterval(() => { nowTick.value = Date.now() }, 30000)
})
onBeforeUnmount(() => {
  if (unsubFertRelay) unsubFertRelay()
  if (unsubIrrigRelays) unsubIrrigRelays()
  if (unsubFertSchedule) unsubFertSchedule()
  if (scheduleTick) clearInterval(scheduleTick)
})

const nowTick = ref(Date.now())
const fertScheduleActive = computed(() => {
  const sch = fertSchedule.value
  if (!sch) return false
  void nowTick.value
  const now = new Date()
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const today = dayKeys[now.getDay()]
  if (!sch.days?.[today]) return false
  const mins = now.getHours() * 60 + now.getMinutes()
  const start = (sch.startHour ?? 0) * 60 + (sch.startMinute ?? 0)
  const end = (sch.endHour ?? 0) * 60 + (sch.endMinute ?? 0)
  return start <= end ? (mins >= start && mins < end) : (mins >= start || mins < end)
})

// ── Misting tab ──────────────────────────────────────────────────────────
const misting = useMisting()
const mistingRunning = computed(() =>
  !waterLow.value && (misting.manualOn.value || misting.autoConditionsMet.value)
)
// Show the last known reading even when stale (same as the zone cards);
// staleness only pauses the auto-trigger estimate and shows a warning below.
const tempDisplay = computed(() => {
  const t = misting.sensors.value?.temperature
  return typeof t === 'number' ? celsiusToDisplay(t) : null
})
const humidityDisplay = computed(() => {
  const h = misting.sensors.value?.humidity
  return typeof h === 'number' ? `${h} %` : null
})
const sensorAgeText = computed(() => {
  const u = misting.sensors.value?.updatedAt
  if (!u) return null
  const sec = Math.round((Date.now() - u) / 1000)
  if (sec < 0) return 'timestamp is in the future (check ESP32 clock)'
  if (sec < 90) return `${sec}s ago`
  if (sec < 5400) return `${Math.round(sec / 60)} min ago`
  return `${(sec / 3600).toFixed(1)} h ago`
})
</script>