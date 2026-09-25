<template>
  <article
    class="rounded-xl border p-4 transition-colors"
    :class="status.box"
  >
    <div class="flex items-center justify-between gap-2 mb-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="text-lg">🌫️</span>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-garden-text truncate">Highland Misting</div>
          <div class="text-[10px] text-garden-dim">Bell pepper cooling</div>
        </div>
      </div>
      <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0" :class="status.badge">
        {{ status.text }}
      </span>
    </div>

    <div v-if="m.loading.value" class="h-14 rounded-xl bg-garden-border animate-pulse" />

    <template v-else>
      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="r in rows"
          :key="r.label"
          class="rounded-lg border p-2"
          :class="r.met ? 'border-garden-warn/40 bg-garden-warn/10' : 'border-garden-border bg-garden-surface'"
        >
          <div class="text-[10px] text-garden-dim">{{ r.label }}</div>
          <div class="text-lg font-medium leading-none mt-1" :class="r.value === '—' ? 'text-garden-dim' : 'text-garden-text'">
            {{ r.value }}
          </div>
          <div class="text-[10px] text-garden-dim mt-1">
            Mists at {{ r.comparator }} {{ r.threshold }}<span v-if="r.met" class="text-garden-warn font-semibold"> · reached</span>
          </div>
        </div>
      </div>

      <p class="text-[11px] text-garden-text mt-3">{{ status.detail }}</p>

      <p v-if="m.configFrom.value === 'default'" class="text-[10px] text-garden-dim mt-1">
        No thresholds saved yet — showing defaults.
      </p>
      <p class="text-[10px] text-garden-dim mt-1">
        Auto mode is estimated from the highland DHT22 reading. Manual override and thresholds are on the
        <router-link to="/irrigation" class="text-garden-primary font-semibold hover:underline">Irrigation page</router-link>.
      </p>
    </template>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useMisting } from '@/composables/useMisting'
import { useTempUnit } from '@/composables/useTempUnit'

const props = defineProps({
  // Water reservoir at or below 30% locks out all pumps (paper 2.3, safety interlock).
  waterLow: { type: Boolean, default: false },
})

const m = useMisting()
const { unitLabel, celsiusToDisplay } = useTempUnit()

const rows = computed(() => {
  const s = m.sensors.value
  const fresh = !m.sensorStale.value
  const t = fresh ? celsiusToDisplay(s.temperature) : null
  return [
    {
      label: 'Highland temperature',
      value: t !== null ? `${t}${unitLabel.value}` : '—',
      threshold: `${celsiusToDisplay(m.config.value.tempOn)}${unitLabel.value}`,
      comparator: '≥',
      met: m.tempMet.value,
    },
    {
      label: 'Highland humidity',
      value: fresh && typeof s.humidity === 'number' ? `${s.humidity}%` : '—',
      threshold: `${m.config.value.humidityOn}%`,
      // Decision log item 3 / DOC-CAP 2.3: misting triggers on LOW humidity, not high.
      comparator: '≤',
      met: m.humidityMet.value,
    },
  ]
})

const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

const status = computed(() => {
  const good   = { box: 'bg-garden-good/10 border-garden-good/40',     badge: 'bg-garden-good/15 text-garden-good border-garden-good/40' }
  const warn   = { box: 'bg-garden-warn/10 border-garden-warn/40',     badge: 'bg-garden-warn/15 text-garden-warn border-garden-warn/40' }
  const danger = { box: 'bg-garden-danger/10 border-garden-danger/40', badge: 'bg-garden-danger/15 text-garden-danger border-garden-danger/40' }
  const idle   = { box: 'bg-garden-base border-garden-border',         badge: 'bg-garden-base text-garden-dim border-garden-border' }

  if (props.waterLow) {
    return { ...danger, text: 'LOCKED OUT',
      detail: m.manualOn.value
        ? 'Water reservoir is at or below 30%, so the pump interlock blocks misting. The manual command is still set.'
        : 'Water reservoir is at or below 30%, so the pump interlock blocks misting until it is refilled.' }
  }
  if (m.manualOn.value) {
    const left = m.manualRemainingS.value
    return { ...good, text: 'MANUAL ON',
      detail: left !== null ? `Manual override active, auto-off in ${fmt(left)}.` : 'Manual override active until turned off.' }
  }
  if (m.sensorStale.value) {
    return { ...idle, text: 'NO DATA',
      detail: m.sensorErr.value ?? 'No recent highland reading. Auto misting cannot be estimated.' }
  }
  if (m.autoConditionsMet.value) {
    const which = m.tempMet.value && m.humidityMet.value
      ? 'Temperature is at or above its threshold and humidity is at or below its threshold'
      : m.tempMet.value
        ? 'Temperature is at or above its threshold'
        : 'Humidity is at or below its threshold'
    return { ...warn, text: 'AUTO TRIGGER',
      detail: `${which}. The ESP32 should be misting (either condition alone is enough).` }
  }
  return { ...idle, text: 'STANDBY',
    detail: 'Auto mode is watching the highland reading. Misting starts when either threshold is reached.' }
})
</script>