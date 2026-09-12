<template>
  <div class="p-4 lg:p-6 pb-12 max-w-2xl mx-auto space-y-5">

    <div class="mb-2">
      <h1 class="text-xl font-extrabold text-garden-text">Settings</h1>
      <p class="text-sm text-garden-dim mt-0.5">Manage your preferences and IoT devices.</p>
    </div>

    <!-- ══════════════════════════════════════════════════════
         Display Preferences
         ══════════════════════════════════════════════════════ -->
    <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden">
      <div class="px-5 pt-5 pb-4 border-b border-garden-border flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-garden-base flex items-center justify-center text-lg flex-shrink-0">🎨</div>
        <div>
          <div class="text-sm font-extrabold text-garden-text">Display Preferences</div>
          <div class="text-[11px] text-garden-dim mt-0.5 font-medium">Adjust how data and the interface appear.</div>
        </div>
      </div>

      <div class="p-5 space-y-5">

        <!-- Dark mode (the only toggle actually wired up) -->
        <div>
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-sm font-bold text-garden-text">Dark Mode</div>
              <div class="text-[11px] text-garden-dim mt-0.5">Switch to a low-glare dark palette suited for night-time use.</div>
            </div>
            <button
              role="switch" :aria-checked="isDarkMode"
              class="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-garden-primary/30"
              :class="isDarkMode ? 'bg-garden-primary' : 'bg-garden-border'"
              @click="toggleDarkMode"
            >
              <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200" :style="{ transform: isDarkMode ? 'translateX(20px)' : 'translateX(0)' }" />
            </button>
          </div>
          <div v-if="isDarkMode" class="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-garden-base border border-garden-border">
            <span class="text-sm">🌙</span>
            <span class="text-[11px] font-semibold text-garden-primary">Dark mode is active</span>
          </div>
        </div>

        <div class="h-px bg-garden-border" />

        <!-- Temp unit -->
        <div>
          <div class="text-xs font-bold text-garden-text mb-2">Temperature Unit</div>
          <div class="flex gap-2">
            <button
              class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border"
              :class="unit === 'C' ? 'bg-garden-primary text-white border-garden-primary' : 'bg-transparent border-garden-border text-garden-dim hover:bg-garden-base'"
              @click="setTempUnit('C')"
            >°C — Celsius</button>
            <button
              class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border"
              :class="unit === 'F' ? 'bg-garden-primary text-white border-garden-primary' : 'bg-transparent border-garden-border text-garden-dim hover:bg-garden-base'"
              @click="setTempUnit('F')"
            >°F — Fahrenheit</button>
          </div>
          <p class="text-[11px] text-garden-dim mt-2">
            All sensor readings will display in
            <strong class="text-garden-text">{{ unit === 'C' ? 'Celsius (°C)' : 'Fahrenheit (°F)' }}</strong>.
            <span v-if="unit === 'F'"> Values are converted from raw °C sensor data.</span>
          </p>
        </div>

        <div class="h-px bg-garden-border" />

        <!-- Notifications -->
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-sm font-bold text-garden-text">Push Notifications</div>
            <div class="text-[11px] text-garden-dim mt-0.5">Receive alerts for low reservoirs, sensor faults, and harvest detections.</div>
          </div>
          <button
            role="switch" :aria-checked="notifications"
            class="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-garden-primary/30"
            :class="notifications ? 'bg-garden-primary' : 'bg-garden-border'"
            @click="notifications = !notifications"
          >
            <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200" :style="{ transform: notifications ? 'translateX(20px)' : 'translateX(0)' }" />
          </button>
        </div>

        <!-- Auto-irrigation -->
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-sm font-bold text-garden-text">Auto-Irrigation</div>
            <div class="text-[11px] text-garden-dim mt-0.5">Allow the system to trigger pump circuits automatically based on thresholds.</div>
          </div>
          <button
            role="switch" :aria-checked="autoIrrigation"
            class="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-garden-primary/30"
            :class="autoIrrigation ? 'bg-garden-primary' : 'bg-garden-border'"
            @click="autoIrrigation = !autoIrrigation"
          >
            <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200" :style="{ transform: autoIrrigation ? 'translateX(20px)' : 'translateX(0)' }" />
          </button>
        </div>
        <p class="text-[10px] text-garden-dim/70 -mt-3">Not wired up yet — display only.</p>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         About
         ══════════════════════════════════════════════════════ -->
    <div class="px-5 py-4 rounded-2xl border border-garden-border bg-garden-surface flex items-center justify-between">
      <div>
        <div class="text-xs font-bold text-garden-text">e-Tanim System</div>
        <div class="font-mono text-[10px] text-garden-dim mt-0.5">v2.4.1 · Off-grid IoT · ESP32</div>
      </div>
      <button class="text-xs font-bold text-garden-primary hover:underline underline-offset-2 transition-colors">
        Check for updates
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'
import { useTempUnit } from '@/composables/useTempUnit'

const { isDarkMode, toggleDarkMode } = useDarkMode()

// Temperature unit is a shared, localStorage-persisted preference (see
// useTempUnit) so every view converts the same way. It only affects how
// Celsius sensor readings are displayed — thresholds and Firebase/ESP32
// data stay in Celsius.
const { tempUnit: unit, setTempUnit } = useTempUnit()
const notifications = ref(true)
const autoIrrigation = ref(true)
</script>