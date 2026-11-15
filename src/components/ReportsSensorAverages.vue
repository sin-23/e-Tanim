<template>
  <div class="space-y-5">
    <!-- Controls -->
    <div class="rounded-2xl border border-garden-border bg-garden-surface p-4 flex flex-wrap items-end gap-4">
      <DateRangePicker v-model="range" />
      <div>
        <div class="text-[0.625rem] font-bold text-garden-dim mb-1.5">View</div>
        <SegmentedToggle v-model="view" :options="VIEWS" aria-label="Chart view" />
      </div>
      <div v-if="view === 'combined'">
        <div class="text-[0.625rem] font-bold text-garden-dim mb-1.5">Period</div>
        <SegmentedToggle v-model="period" :options="PERIOD_OPTIONS" aria-label="Period shown" />
      </div>
      <button type="button" class="ml-auto px-3 py-2 rounded-xl border border-garden-border text-xs font-bold text-garden-dim hover:text-garden-primary"
              :disabled="state === 'loading'" @click="reload">Refresh</button>
    </div>

    <div v-if="!systemId" class="rounded-2xl border border-garden-border bg-garden-surface p-10 text-center text-sm font-bold text-garden-text">
      Not joined to a unit yet.
    </div>
    <StatePanel v-else-if="state !== 'ready'" :state="state" noun="averages" />

    <template v-else>
      <p v-if="skipped" class="text-[0.6875rem] font-semibold text-garden-warn">
        {{ skipped }} stored average{{ skipped === 1 ? ' was' : 's were' }} ignored because the values were not valid.
      </p>
      <p v-if="truncated" class="text-[0.6875rem] font-semibold text-garden-warn">
        Only the newest {{ MAX_SHOWN }} stored averages are loaded. Narrow the range to see older ones.
      </p>

      <!-- Charts -->
      <div class="grid gap-4" :class="view === 'combined' ? 'lg:grid-cols-2' : 'grid-cols-1'">
        <template v-for="m in METRICS" :key="m.key">
          <div v-if="view === 'combined'" class="rounded-2xl border border-garden-border bg-garden-surface p-4">
            <div class="text-sm font-bold text-garden-text mb-2">{{ m.title }} <span class="text-garden-dim font-semibold">· {{ periodLabel }}</span></div>
            <LineChart :labels="labels" :datasets="combinedSets(m)" :y-title="unitOf(m)" :decimals="m.decimals"
                       :aria-label="`${m.title}, lowland and highland, ${periodLabel}`" />
          </div>
          <div v-else class="rounded-2xl border border-garden-border bg-garden-surface p-4">
            <div class="text-sm font-bold text-garden-text mb-2">{{ m.title }}</div>
            <div class="grid gap-4 lg:grid-cols-2">
              <div v-for="z in ZONES" :key="z.id">
                <div class="text-[0.6875rem] font-bold text-garden-dim mb-1">{{ z.label }}</div>
                <LineChart :labels="labels" :datasets="zoneSets(m, z.id)" :y-title="unitOf(m)" :decimals="m.decimals"
                           :aria-label="`${m.title}, ${z.label} zone, by period`" />
              </div>
            </div>
          </div>
        </template>
      </div>
      <p class="text-[0.6875rem] text-garden-dim">
        Dashed lines are reference lines: the {{ gateText }} kPa VPD gate and the saved soil moisture thresholds
        (combined view: the normal-start level of each zone; by zone: emergency, normal start and stop).
        Daily is the average of the periods that exist for that date, weighted by sample count.
        Dates and periods are in garden time (UTC+8).
      </p>

      <!-- Table -->
      <AveragesTable :rows="rows" :thresholds="thresholds" />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import DateRangePicker from '@/components/DateRangePicker.vue'
import SegmentedToggle from '@/components/SegmentedToggle.vue'
import StatePanel from '@/components/StatePanel.vue'
import LineChart from '@/components/LineChart.vue'
import AveragesTable from '@/components/AveragesTable.vue'
import { useZonePeriodAverages } from '@/composables/useZonePeriodAverages'
import { celsiusToDisplay, tempUnit } from '@/composables/useTempUnit'
import { systemId } from '@/composables/useSystemId'

const MAX_SHOWN = 2000
const ZONES = [{ id: 'lowland', label: 'Lowland zone' }, { id: 'highland', label: 'Highland zone' }]
const VIEWS = [{ id: 'combined', label: 'Combined' }, { id: 'zones', label: 'By zone' }]
const PERIOD_OPTIONS = [
  { id: 'daily', label: 'Daily' }, { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' }, { id: 'night', label: 'Night' },
]
const METRICS = [
  { key: 'soilMoisture', title: 'Soil moisture', unit: '%',   decimals: 1 },
  { key: 'temperature',  title: 'Temperature',   unit: null,  decimals: 1 },
  { key: 'humidity',     title: 'Humidity',      unit: '%',   decimals: 1 },
  { key: 'vpd',          title: 'VPD',           unit: 'kPa', decimals: 2 },
]
const unitOf = (m) => m.unit ?? `°${tempUnit.value}`

const { rows, state, skipped, truncated, thresholds, load, loadThresholds } = useZonePeriodAverages()
const range = ref({ preset: '30d', from: null, to: null })
const view = ref('combined')
const period = ref('daily')
const periodLabel = computed(() => PERIOD_OPTIONS.find(p => p.id === period.value).label)

const reload = () => load({ from: range.value.from, to: range.value.to })
// The picker fills in the dates when it mounts, which triggers the first load.
watch(range, () => { if (systemId.value) reload() }, { deep: true })
watch(systemId, (id) => { if (id) { loadThresholds(); if (range.value.from || range.value.preset === 'all') reload() } })
onMounted(() => { if (systemId.value) loadThresholds() })

// ── Chart data (oldest to newest, left to right) ────────────────────────────
const asc = computed(() => [...rows.value].reverse())
const labels = computed(() => asc.value.map(r =>
  new Date(`${r.date}T00:00:00Z`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'UTC' })))

function series(zone, p, metric) {
  return asc.value.map(r => {
    const v = r[zone][p]?.[metric.key]
    if (v === undefined || v === null) return null
    return metric.key === 'temperature' ? celsiusToDisplay(v, 2) : v
  })
}
const flat = (value) => labels.value.map(() => value)
const gateOf = (z) => thresholds.value[z].vpdGate
const gateText = computed(() => gateOf('lowland') === gateOf('highland')
  ? gateOf('lowland') : `${gateOf('lowland')} (lowland) and ${gateOf('highland')} (highland)`)

function combinedSets(m) {
  const sets = [
    { label: 'Lowland',  data: series('lowland',  period.value, m), color: 'primary' },
    { label: 'Highland', data: series('highland', period.value, m), color: 'sky' },
  ]
  if (m.key === 'soilMoisture') {
    sets.push({ label: 'Lowland normal start',  data: flat(thresholds.value.lowland.smNormal),  color: 'primary', dashed: true, width: 1.5 })
    sets.push({ label: 'Highland normal start', data: flat(thresholds.value.highland.smNormal), color: 'sky',     dashed: true, width: 1.5 })
  }
  if (m.key === 'vpd') {
    if (gateOf('lowland') === gateOf('highland')) {
      sets.push({ label: 'VPD gate', data: flat(gateOf('lowland')), color: 'danger', dashed: true, width: 1.5 })
    } else {
      sets.push({ label: 'Lowland VPD gate',  data: flat(gateOf('lowland')),  color: 'primary', dashed: true, width: 1.5 })
      sets.push({ label: 'Highland VPD gate', data: flat(gateOf('highland')), color: 'sky',     dashed: true, width: 1.5 })
    }
  }
  return sets
}

function zoneSets(m, zone) {
  const sets = [
    { label: 'Daily',     data: series(zone, 'daily',     m), color: 'primary', width: 3 },
    { label: 'Morning',   data: series(zone, 'morning',   m), color: 'earth',   width: 1.5, points: 2 },
    { label: 'Afternoon', data: series(zone, 'afternoon', m), color: 'sky',     width: 1.5, points: 2 },
    { label: 'Night',     data: series(zone, 'night',     m), color: 'eggplant', width: 1.5, points: 2 },
  ]
  const t = thresholds.value[zone]
  if (m.key === 'soilMoisture') {
    sets.push({ label: `Emergency ${t.smEmergency}%`,    data: flat(t.smEmergency), color: 'danger', dashed: true, width: 1.5 })
    sets.push({ label: `Normal start ${t.smNormal}%`,    data: flat(t.smNormal),    color: 'warn',   dashed: true, width: 1.5 })
    sets.push({ label: `Stop ${t.smStop}%`,              data: flat(t.smStop),      color: 'dim',    dashed: true, width: 1.5 })
  }
  if (m.key === 'vpd') sets.push({ label: `VPD gate ${t.vpdGate} kPa`, data: flat(t.vpdGate), color: 'danger', dashed: true, width: 1.5 })
  return sets
}
</script>