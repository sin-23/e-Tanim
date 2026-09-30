<template>
  <!-- Zone Summary card, shared by the Dashboard and the Irrigation page. -->
  <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden">
    <div class="p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-[10px] uppercase tracking-widest text-garden-dim">Zone Summary</div>
          <div class="text-base font-semibold text-garden-text">
            {{ zone.id === 'lowland' ? '🍅🍆' : '🌿' }} {{ zone.label }}
          </div>
        </div>
      </div>

      <div v-if="zone.loading" class="py-8 text-center text-xs font-mono text-garden-dim">Awaiting sensor data…</div>
      <div v-else-if="zone.error" class="py-6 text-center text-xs text-garden-danger">{{ zone.error }}</div>

      <!-- Zone Sensor Summary -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div class="p-2.5 rounded-xl" :style="{ backgroundColor: `${zoneColor(zone.colorKey)}1a` }">
          <div class="text-[8px] uppercase tracking-widest text-garden-dim mb-1">Moisture</div>
          <div class="text-base font-mono" :style="{ color: zoneColor(zone.colorKey) }">
            {{ zone.sensors.moisture !== null ? `${zone.sensors.moisture}%` : '—' }}
          </div>
        </div>

        <div class="p-2.5 rounded-xl bg-garden-warn/10">
          <div class="text-[8px] uppercase tracking-widest text-garden-dim mb-1">Temperature</div>
          <div class="text-base font-mono text-garden-warn">
            {{ zone.sensors.temperature !== null ? `${celsiusToDisplay(zone.sensors.temperature)}${unitLabel}` : '—' }}
          </div>
        </div>

        <div class="p-2.5 rounded-xl bg-garden-sky/10">
          <div class="text-[8px] uppercase tracking-widest text-garden-dim mb-1">Humidity</div>
          <div class="text-base font-mono text-garden-sky">
            {{ zone.sensors.humidity !== null ? `${zone.sensors.humidity}%` : '—' }}
          </div>
        </div>

        <div class="p-2.5 rounded-xl bg-garden-base">
          <div class="text-[8px] uppercase tracking-widest text-garden-dim mb-1">VPD</div>
          <div class="text-base font-mono text-garden-primary">
            {{ zone.vpd !== null ? zone.vpd : '—' }}
            <span v-if="zone.vpd !== null" class="text-[8px] text-garden-dim ml-1">kPa</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTempUnit } from '@/composables/useTempUnit'

defineProps({
  zone: { type: Object, required: true },
})

const { unitLabel, celsiusToDisplay } = useTempUnit()

// Original Dashboard zone colors (green / blue).
const ZONE_COLORS = { lowland: '#2d7a4f', highland: '#3b9dd2' }
function zoneColor(colorKey) { return ZONE_COLORS[colorKey] ?? '#2d7a4f' }

</script>