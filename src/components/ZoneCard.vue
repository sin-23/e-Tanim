<template>
  <article
    class="bg-garden-surface rounded-2xl border shadow-sm overflow-hidden
           transition-all duration-500 animate-slide-up"
    :style="{ borderColor: zoneColorBorder, animationDelay: `${delay}ms` }"
  >
    <!-- Top accent strip -->
    <div class="h-1" :style="{ backgroundColor: zoneColor }" />

    <div class="p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-1 gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: zoneColor }" />
          <span class="text-sm font-semibold text-garden-text truncate">{{ zone.label }}</span>
        </div>
        <span class="text-[10px] font-mono text-garden-dim flex-shrink-0">
          <template v-if="zone.loading">syncing…</template>
          <template v-else-if="zone.error">error</template>
          <template v-else>{{ lastUpdated }}</template>
        </span>
      </div>

      <!-- Crops in this zone -->
      <div class="flex flex-wrap gap-1.5 mb-2">
        <span
          v-for="c in zone.crops"
          :key="c.nodeId"
          class="text-[10px] font-medium px-2 py-0.5 rounded-full border"
          :class="c.error
            ? 'bg-garden-danger/10 text-garden-danger border-garden-danger/30'
            : 'bg-garden-base text-garden-dim border-garden-border'"
          :title="c.error || `sensors/${c.nodeId}`"
        >
          {{ c.emoji }} {{ c.label }}<template v-if="c.error"> ⚠</template>
        </span>
        <span v-if="zone.crops.length > 1" class="text-[10px] text-garden-dim self-center">
          · readings averaged
        </span>
      </div>

      <!-- Loading skeleton -->
      <div v-if="zone.loading" class="py-10 flex justify-center">
        <div class="flex gap-3 items-center text-garden-dim text-sm font-mono">
          <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Awaiting sensor data…
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="zone.error" class="py-6 text-center">
        <p class="text-garden-danger font-mono text-sm">{{ zone.error }}</p>
        <p class="text-garden-dim text-xs mt-1">
          Check Firebase paths: {{ zone.crops.map(c => `sensors/${c.nodeId}`).join(', ') }}
        </p>
      </div>

      <!-- Sensor readings -->
      <template v-else>
        <!-- Soil gauge -->
        <div class="my-3">
          <div class="flex justify-center">
            <SensorGauge
              :value="zone.sensors.moisture"
              :min="0"
              :max="100"
              unit="%"
              label="Soil Moisture"
              :color="zoneColor"
              :status="moistureStatus"
              :size="144"
              :stroke-width="10"
              :show-label="false"
            />
          </div>
          <div class="text-center text-[10px] font-medium tracking-widest uppercase text-garden-dim mt-1">
            Soil Moisture
          </div>
        </div>

        <!-- Temperature + Humidity + VPD -->
        <div class="grid grid-cols-3 gap-2">
          <SensorStat
            :value="celsiusToDisplay(zone.sensors.temperature)"
            :unit="unitLabel"
            label="Temperature"
            :color="zoneColor"
            :status="tempStatus"
          />
          <SensorStat
            :value="zone.sensors.humidity"
            unit="%"
            label="Humidity"
            :color="zoneColor"
            :status="humidityStatus"
          />
          <SensorStat
            :value="zone.vpd"
            unit=" kPa"
            label="VPD"
            :color="zoneColor"
            :status="vpdStatus"
          />
        </div>

        <!-- Irrigation trigger score (dashboard estimate) -->
        <div class="mt-3 p-2.5 rounded-xl bg-garden-void border border-garden-border">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[9px] font-medium uppercase tracking-widest text-garden-dim">
              Irrigation Score
            </span>
            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border whitespace-nowrap"
                  :class="scoreBadge.class">
              {{ scoreBadge.text }}
            </span>
          </div>
          <div class="relative h-2 rounded-full bg-garden-border overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700"
                 :style="{ width: `${zone.score ?? 0}%`, backgroundColor: zoneColor }" />
            <div class="absolute top-0 bottom-0 w-px bg-garden-text/60"
                 :style="{ left: `${zone.score_cfg.triggerAt}%` }" />
          </div>
          <div class="flex justify-between mt-1 text-[10px] font-mono text-garden-dim">
            <span>{{ zone.score !== null ? zone.score : '—' }} / 100</span>
            <span>trigger ≥ {{ zone.score_cfg.triggerAt }}</span>
          </div>
        </div>

        <!-- Warning strip -->
        <div
          v-if="overallHealth !== 'ok'"
          class="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
          :class="overallStripClasses"
        >
          <span class="text-sm flex-shrink-0">{{ overallIcon }}</span>
          <span class="text-[11px] font-medium" :class="overallTextClass">
            {{ overallMessage }}
          </span>
        </div>
      </template>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import SensorGauge from './SensorGauge.vue'
import SensorStat  from './SensorStat.vue'
import { getSensorStatus } from '@/composables/useSensorData'
import { isDarkMode } from '@/composables/useDarkMode'
import { useTempUnit } from '@/composables/useTempUnit'

const { unitLabel, celsiusToDisplay } = useTempUnit()

const props = defineProps({
  zone:  { type: Object, required: true },
  delay: { type: Number, default: 0 },
})

// ── Zone colours (match pump colours on the override cards) ────────────────
const COLOR_MAP = {
  lowland:  { main: '#2d7a4f' },
  highland: { main: '#3b9dd2' },
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

const zoneColor = computed(() => COLOR_MAP[props.zone.colorKey]?.main ?? '#2d7a4f')
const zoneColorBorder = computed(() =>
  `rgba(${hexToRgb(zoneColor.value)}, ${isDarkMode.value ? 0.35 : 0.55})`
)

// ── Sensor status ──────────────────────────────────────────────────────────
const th = computed(() => props.zone.thresholds)
const moistureStatus = computed(() => getSensorStatus(props.zone.sensors?.moisture,    th.value.moisture))
const tempStatus     = computed(() => getSensorStatus(props.zone.sensors?.temperature, th.value.temperature))
const humidityStatus = computed(() => getSensorStatus(props.zone.sensors?.humidity,    th.value.humidity))
const vpdStatus      = computed(() => getSensorStatus(props.zone.vpd,                  th.value.vpd))

// ── Irrigation score badge ─────────────────────────────────────────────────
const scoreBadge = computed(() => {
  const s = props.zone.score
  if (s === null || s === undefined)
    return { text: 'NO DATA', class: 'bg-garden-base text-garden-dim border-garden-border' }
  return s >= props.zone.score_cfg.triggerAt
    ? { text: 'WATER NEEDED', class: 'bg-garden-danger/15 text-garden-danger border-garden-danger/40' }
    : { text: 'HOLD',         class: 'bg-garden-good/15 text-garden-good border-garden-good/40' }
})

// ── Overall health ─────────────────────────────────────────────────────────
const allStatuses = computed(() => [
  moistureStatus.value, tempStatus.value, humidityStatus.value, vpdStatus.value,
])

const overallHealth = computed(() => {
  if (allStatuses.value.includes('high'))       return 'danger'
  if (allStatuses.value.includes('low'))        return 'warn'
  if (allStatuses.value.every(s => s === 'ok')) return 'ok'
  return 'unknown'
})

const OVERALL_MAP = {
  warn:    { icon: '⚠️', msg: 'One or more readings below optimal', strip: 'bg-garden-warn/10 border-garden-warn/30', text: 'text-garden-warn' },
  danger:  { icon: '🔴', msg: 'Reading exceeds safe threshold',      strip: 'bg-garden-danger/5 border border-garden-danger/20', text: 'text-garden-danger' },
  unknown: { icon: '·',  msg: 'Waiting for sensor data',             strip: 'bg-garden-muted/5 border border-garden-border', text: 'text-garden-dim' },
}

const overallIcon         = computed(() => OVERALL_MAP[overallHealth.value]?.icon  ?? '')
const overallMessage      = computed(() => OVERALL_MAP[overallHealth.value]?.msg   ?? '')
const overallStripClasses = computed(() => OVERALL_MAP[overallHealth.value]?.strip ?? '')
const overallTextClass    = computed(() => OVERALL_MAP[overallHealth.value]?.text  ?? '')

// ── Timestamp ─────────────────────────────────────────────────────────────
const lastUpdated = computed(() => {
  const ts = props.zone.sensors?.updatedAt
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})
</script>