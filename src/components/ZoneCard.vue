<template>
  <!-- Zone Summary card, shared by the Dashboard and the Irrigation page. -->
  <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden">
    <div class="p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-base font-semibold text-garden-text">
            {{ zone.id === 'lowland' ? '🍅🍆' : '🫑' }} {{ zone.label }}
          </div>
        </div>

        <!-- Pump state; only shown when the parent passes it (Irrigation page) -->
        <span
          v-if="pumpOn !== null"
          class="flex items-center gap-1.5 text-[0.625rem] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full flex-shrink-0"
          :class="pumpOn ? 'bg-garden-good/15 text-garden-good' : 'bg-garden-base text-garden-dim'"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="pumpOn ? 'bg-garden-good animate-pulse' : 'bg-garden-dim'" />
          {{ pumpOn ? 'Running' : 'Off' }}
        </span>
      </div>

      <div v-if="zone.loading" class="py-8 text-center text-xs font-mono text-garden-dim">Awaiting sensor data…</div>
      <div v-else-if="zone.error" class="py-6 text-center text-xs text-garden-danger">{{ zone.error }}</div>

      <!-- Zone Sensor Summary -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div class="p-2.5 rounded-xl bg-garden-base">
          <div class="text-[0.5rem] uppercase tracking-widest text-garden-dim mb-1">Moisture</div>
          <div class="text-base font-mono" :style="{ color: statusColor(zone.sensors.moisture, 'moisture') }">
            {{ zone.sensors.moisture !== null ? `${zone.sensors.moisture} %` : '—' }}
          </div>
        </div>

        <div class="p-2.5 rounded-xl bg-garden-base">
          <div class="text-[0.5rem] uppercase tracking-widest text-garden-dim mb-1">Temperature</div>
          <div class="text-base font-mono" :style="{ color: statusColor(zone.sensors.temperature, 'temperature') }">
            {{ zone.sensors.temperature !== null ? `${celsiusToDisplay(zone.sensors.temperature)} ${unitLabel}` : '—' }}
          </div>
        </div>

        <div class="p-2.5 rounded-xl bg-garden-base">
          <div class="text-[0.5rem] uppercase tracking-widest text-garden-dim mb-1">Humidity</div>
          <div class="text-base font-mono" :style="{ color: statusColor(zone.sensors.humidity, 'humidity') }">
            {{ zone.sensors.humidity !== null ? `${zone.sensors.humidity} %` : '—' }}
          </div>
        </div>

        <div class="p-2.5 rounded-xl bg-garden-base">
          <div class="text-[0.5rem] uppercase tracking-widest text-garden-dim mb-1">VPD</div>
          <div class="text-base font-mono" :style="{ color: statusColor(zone.vpd, 'vpd') }">
            {{ zone.vpd !== null ? zone.vpd : '—' }} kPa
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTempUnit } from '@/composables/useTempUnit'
import { getSensorStatus } from '@/composables/useSensorData'

const props = defineProps({
  zone: { type: Object, required: true },
  pumpOn: { type: Boolean, default: null },
})

const { unitLabel, celsiusToDisplay } = useTempUnit()

// Reading colors carry meaning: inside the zone's healthy band = green (good),
// outside it (too low / too high) = orange (warning), no data = neutral.
// Bands come from the zone's own `thresholds` (ZONE_META in useSensorData.js).
const STATUS_COLOR = {
  ok:      'rgb(var(--garden-good))',
  low:     'rgb(var(--garden-warn))',
  high:    'rgb(var(--garden-warn))',
  unknown: 'rgb(var(--garden-dim))',
}
function statusColor(value, key) {
  const band = props.zone.thresholds?.[key]
  if (!band) return 'rgb(var(--garden-text))'
  return STATUS_COLOR[getSensorStatus(value, band)]
}

</script>