<template>
  <div class="p-4 lg:p-6 space-y-6 pb-12">

    <!-- Environmental Sensors -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in" style="animation-delay:100ms">

      <div class="bg-white rounded-2xl border border-garden-border shadow-sm p-4 lg:p-5 lg:col-span-1">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-garden-text tracking-tight flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
            </svg>
            Environmental Sensors
          </h2>
          <span class="text-[10px] text-garden-dim font-semibold bg-[#eef3f0] px-2 py-0.5 rounded-full">DHT22</span>
        </div>

        <div class="space-y-3">
          <!-- Temperature -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-[#fff8ec] border border-[#fde68a]/60">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-[#fef3c7] flex items-center justify-center flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-garden-text">Temperature</div>
                <div class="text-[10px] text-garden-dim">Ambient air</div>
              </div>
            </div>
            <span class="text-lg font-medium text-[#d97706]">
              {{ averages.temperature !== null ? `${averages.temperature}°C` : '—' }}
            </span>
          </div>

          <!-- Humidity -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-[#eff8ff] border border-[#93c5fd]/40">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-[#dbeafe] flex items-center justify-center flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-garden-text">Humidity</div>
                <div class="text-[10px] text-garden-dim">Relative humidity</div>
              </div>
            </div>
            <span class="text-lg font-medium text-[#2563eb]">
              {{ averages.humidity !== null ? `${averages.humidity}%` : '—' }}
            </span>
          </div>

          <!-- Soil moisture -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-[#f5ede6] border border-[#d97706]/20">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-[#fed7aa]/60 flex items-center justify-center flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5e3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-garden-text">Soil Moisture</div>
                <div class="text-[10px] text-garden-dim">Capacitive probe (avg.)</div>
              </div>
            </div>
            <span class="text-lg font-medium text-[#8b5e3c]">
              {{ averages.moisture !== null ? `${averages.moisture}%` : '—' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Irrigation Circuit Summary (read-only — controls live on the Irrigation page) -->
      <div class="bg-white rounded-2xl border border-garden-border shadow-sm p-4 lg:p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-garden-text tracking-tight flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b9dd2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
            Irrigation &amp; Fertilization
          </h2>
          <span class="text-[10px] font-semibold text-garden-dim bg-[#eef3f0] px-2 py-1 rounded-full">2 Circuits</span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="c in circuits"
            :key="c.id"
            class="flex items-center justify-between p-3 rounded-xl border"
            :style="{ backgroundColor: c.light, borderColor: c.border }"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-lg">{{ c.emoji }}</span>
              <div>
                <div class="text-xs font-medium text-garden-text">Pump {{ c.id }} — {{ c.title }}</div>
                <div class="text-[10px] text-garden-dim">Pump · Relay · Solenoid · Sprinkler</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                :style="c.relay
                  ? { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }
                  : { backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }"
              >{{ c.relay ? 'FORCED ON' : 'AUTO' }}</span>
              <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: c.relay ? '#22c55e' : '#94a3b8' }" />
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-[#eef3f0] flex items-center justify-between gap-3">
          <p class="text-[11px] text-garden-dim">
            {{ activePumpMessage }}
          </p>
          <router-link
            to="/irrigation"
            class="px-3 py-1.5 rounded-xl bg-garden-primary text-white text-xs font-medium hover:bg-[#246040] transition-colors flex-shrink-0"
          >
            Manage →
          </router-link>
        </div>
      </div>

    </section>

    <!-- Activity Log -->
    <section class="bg-white rounded-2xl border border-garden-border shadow-sm p-4 lg:p-5 max-w-2xl">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-garden-text tracking-tight flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d7a4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Activity Log
        </h2>
      </div>
      <div v-if="activityLog.length === 0" class="text-center py-8 text-xs text-garden-dim">
        No activity yet this session — pump events will appear here as they happen.
      </div>
      <div v-else class="space-y-1 overflow-y-auto max-h-72 pr-1">
        <div
          v-for="log in activityLog"
          :key="log.id"
          class="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-[#f4f8f5] transition-colors"
        >
          <div class="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ backgroundColor: log.color }" />
          <div class="min-w-0 flex-1">
            <div class="text-xs font-semibold text-garden-text leading-snug">{{ log.msg }}</div>
            <div class="text-[10px] text-garden-dim mt-0.5">{{ log.time }} today</div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { db } from '@/firebase'

const today = computed(() =>
  new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
)

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

// ── Live relay state (read-only summary — feeds circuit list + activity log) ─
const relay1On = ref(false)
const relay2On = ref(false)
const activityLog = ref([])
let unsubRelay1 = null
let unsubRelay2 = null
let logId = 0

function pushLog(msg, color) {
  const time = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  activityLog.value.unshift({ id: logId++, msg, time, color })
  if (activityLog.value.length > 20) activityLog.value.pop()
}

import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
  let firstRelay1 = true
  const relay1Ref = dbRef(db, 'control/relay')
  const unsub1 = onValue(relay1Ref, (snapshot) => {
    const val = snapshot.val() === true
    if (!firstRelay1 && val !== relay1On.value) {
      pushLog(`Pump 1 relay turned ${val ? 'ON' : 'OFF'}`, val ? '#22c55e' : '#94a3b8')
    }
    relay1On.value = val
    firstRelay1 = false
  })
  unsubRelay1 = () => off(relay1Ref, 'value', unsub1)

  let firstRelay2 = true
  const relay2Ref = dbRef(db, 'control/relay2')
  const unsub2 = onValue(relay2Ref, (snapshot) => {
    const val = snapshot.val() === true
    if (!firstRelay2 && val !== relay2On.value) {
      pushLog(`Pump 2 relay turned ${val ? 'ON' : 'OFF'}`, val ? '#22c55e' : '#94a3b8')
    }
    relay2On.value = val
    firstRelay2 = false
  })
  unsubRelay2 = () => off(relay2Ref, 'value', unsub2)
})

onUnmounted(() => { if (unsubRelay1) unsubRelay1(); if (unsubRelay2) unsubRelay2() })

const circuits = computed(() => [
  { id: 1, title: 'Pump 1 Override', emoji: '💧', light: relay1On.value ? '#fef2f2' : '#f8fafc', border: relay1On.value ? '#fca5a5' : '#e2e8f0', relay: relay1On.value },
  { id: 2, title: 'Pump 2 Override', emoji: '🧪', light: relay2On.value ? '#fef2f2' : '#f8fafc', border: relay2On.value ? '#fca5a5' : '#e2e8f0', relay: relay2On.value },
])

const activePumpMessage = computed(() => {
  const active = circuits.value.filter(c => c.relay)
  if (active.length === 0) return 'No pumps currently active.'
  return `${active.map(c => c.title).join(', ')} currently active.`
})
</script>
