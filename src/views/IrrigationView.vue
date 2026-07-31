<template>
  <div class="p-4 lg:p-6 space-y-6 pb-12">

    <!-- Avg stats bar -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div
        v-for="(stat, i) in summaryStats"
        :key="i"
        class="bg-white rounded-xl border border-garden-border shadow-sm px-4 py-3 flex items-center gap-3"
      >
        <span class="text-lg leading-none">{{ stat.icon }}</span>
        <div>
          <div class="text-[10px] font-normal uppercase tracking-widest text-garden-dim">{{ stat.label }}</div>
          <div class="text-lg font-medium" :style="{ color: stat.color }">{{ stat.value }}</div>
        </div>
      </div>
    </div>

    <!-- Pump control cards -->
    <div>
      <h2 class="text-sm font-semibold text-garden-text tracking-tight mb-3 flex items-center gap-2">
        <span class="w-1.5 h-4 rounded-full bg-garden-primary inline-block" />
        Pump Override Controls
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RelayControl
          :current-moisture="averages.moisture"
          :current-temperature="averages.temperature"
          :current-humidity="averages.humidity"
          :readonly="!isLoggedIn"
          title="Pump 1 — Irrigation"
          :show-threshold-settings="true"
          :pump-number="1"
        />
        <RelayControl
          :readonly="!isLoggedIn"
          controlPath="control/relay2"
          title="Pump 2 — Leachate (FFJ)"
          :show-threshold-settings="false"
          :pump-number="2"
        />
        <RelayControl
          :readonly="!isLoggedIn"
          controlPath="control/relay3"
          title="Pump 3 — Organic Fertilizer (Storebought)"
          :show-threshold-settings="false"
          :pump-number="3"
        />
      </div>
    </div>

    <!-- Fertilizer schedule -->
    <div>
      <h2 class="text-sm font-semibold text-garden-text tracking-tight mb-3 flex items-center gap-2">
        <span class="w-1.5 h-4 rounded-full bg-garden-primary inline-block" />
        Fertilizer Schedule &amp; Source
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FertScheduleCard :readonly="!isLoggedIn" />
      </div>
    </div>

    <!-- Zone sensor readings -->
    <div>
      <h2 class="text-sm font-semibold text-garden-text tracking-tight mb-3 flex items-center gap-2">
        <span class="w-1.5 h-4 rounded-full bg-garden-primary inline-block" />
        Zone Sensor Readings
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ZoneCard
          v-for="(zone, i) in zones"
          :key="zone.id"
          :zone="zone"
          :delay="i * 120"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import ZoneCard        from '@/components/ZoneCard.vue'
import RelayControl    from '@/components/RelayControl.vue'
import FertScheduleCard from '@/components/FertScheduleCard.vue'
import { useSensorData } from '@/composables/useSensorData'
import { useAuth }  from '@/auth/useAuth'
import { db }       from '@/firebase'

const { zones }      = useSensorData()
const { isLoggedIn } = useAuth()

const averages = ref({ moisture: null, temperature: null, humidity: null, tds: null })
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
        tds:         data.tds         ?? null,
      }
    }
  })
  unsubAvg = () => off(avgRef, 'value', unsub)
})

onUnmounted(() => { if (unsubAvg) unsubAvg() })

const summaryStats = computed(() => [
  {
    label: 'Avg. Soil Moisture',
    value: averages.value.moisture    !== null ? `${averages.value.moisture} %`     : '—',
    color: '#3b9dd2',
    icon: '💧',
  },
  {
    label: 'Avg. Temperature',
    value: averages.value.temperature !== null ? `${averages.value.temperature} °C` : '—',
    color: '#f59e0b',
    icon: '🌡️',
  },
  {
    label: 'Avg. Humidity',
    value: averages.value.humidity    !== null ? `${averages.value.humidity} %`     : '—',
    color: '#7c3aed',
    icon: '💨',
  },
])
</script>