<template>
  <div class="p-4 lg:p-6 space-y-6 pb-12">
    <div>
    <!-- Avg sensor readings — mirrors the Dashboard's Environmental Sensors
         card (same icon boxes, colored rows, and Temp → Humidity → Soil
         Moisture order) instead of the old flat 3-card row. -->
      <h2 class="text-sm font-semibold text-garden-text tracking-tight mb-3 flex items-center gap-2">
        <span class="w-1.5 h-4 rounded-full bg-garden-primary inline-block" />
        Environmental Sensors
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Temperature -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-garden-warn/10 border border-garden-warn/30">
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
        <div class="flex items-center justify-between p-3 rounded-xl bg-garden-sky/10 border border-garden-sky/30">
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
        <div class="flex items-center justify-between p-3 rounded-xl bg-garden-earth/10 border border-garden-earth/30">
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
import { useTempUnit } from '@/composables/useTempUnit'

const { unitLabel, celsiusToDisplay } = useTempUnit()

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
</script>