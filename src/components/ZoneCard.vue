<template>
  <article
    class="bg-white rounded-2xl border shadow-sm overflow-hidden
           transition-all duration-500 animate-slide-up"
    :style="{ borderColor: plantColorBorder, animationDelay: `${delay}ms` }"
  >
    <!-- Top accent strip -->
    <div class="h-1" :style="{ backgroundColor: plantColor }" />

    <div class="p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-1 gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: plantColor }" />
          <span class="text-[10px] font-medium uppercase tracking-widest text-garden-dim whitespace-nowrap">
            {{ zone.label }}
          </span>
          <span class="text-sm font-semibold text-garden-text truncate">
            {{ zone.emoji }} {{ zone.plant }}
          </span>
        </div>
        <span class="text-[10px] font-mono text-garden-dim flex-shrink-0">
          <template v-if="zone.loading">syncing…</template>
          <template v-else-if="zone.error">error</template>
          <template v-else>{{ lastUpdated }}</template>
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
        <p class="text-garden-dim text-xs mt-1">Check Firebase path: sensors/{{ zone.id }}</p>
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
              :color="plantColor"
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

        <!-- Temperature + Humidity stats -->
        <div class="grid grid-cols-2 gap-2">
          <SensorStat
            :value="zone.sensors.temperature"
            unit="°C"
            label="Temperature"
            :color="plantColor"
            :status="tempStatus"
          />
          <SensorStat
            :value="zone.sensors.humidity"
            unit="%"
            label="Humidity"
            :color="plantColor"
            :status="humidityStatus"
          />
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

const props = defineProps({
  zone:  { type: Object, required: true },
  delay: { type: Number, default: 0 },
})

// ── Plant colour map (matches Figma pump zone colors) ──────────────────────
const COLOR_MAP = {
  tomato:   { main: '#dc2626', border: '#fca5a5' },
  okra:     { main: '#2d7a4f', border: '#86efac' },
  eggplant: { main: '#7c3aed', border: '#c4b5fd' },
}

const plantColor       = computed(() => COLOR_MAP[props.zone.colorKey]?.main   ?? '#2d7a4f')
const plantColorBorder = computed(() => COLOR_MAP[props.zone.colorKey]?.border ?? '#d8e8de')

// ── Sensor status ──────────────────────────────────────────────────────────
const { thresholds } = props.zone

const moistureStatus = computed(() =>
  getSensorStatus(props.zone.sensors?.moisture, thresholds.moisture)
)
const tempStatus = computed(() =>
  getSensorStatus(props.zone.sensors?.temperature, thresholds.temperature)
)
const humidityStatus = computed(() =>
  getSensorStatus(props.zone.sensors?.humidity, thresholds.humidity)
)

// ── Overall health ─────────────────────────────────────────────────────────
const allStatuses = computed(() => [
  moistureStatus.value,
  tempStatus.value,
  humidityStatus.value,
])

const overallHealth = computed(() => {
  if (allStatuses.value.includes('high'))    return 'danger'
  if (allStatuses.value.includes('low'))     return 'warn'
  if (allStatuses.value.every(s => s === 'ok')) return 'ok'
  return 'unknown'
})

const OVERALL_MAP = {
  warn:    { icon: '⚠️', msg: 'One or more readings below optimal', strip: 'bg-[#fff7ed] border border-[#fed7aa]', text: 'text-[#9a3412]' },
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
  return new Date(ts).toLocaleTimeString('en-PH', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})
</script>
