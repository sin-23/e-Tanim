<template>
  <div class="p-4 lg:p-6 pb-12 max-w-2xl mx-auto space-y-5">

    <div class="mb-2">
      <h1 class="text-xl font-extrabold text-garden-text">Settings</h1>
      <p class="text-sm text-garden-dim mt-0.5">Display preferences for the e-Tanim dashboard.</p>
    </div>

    <!-- ══════════════════════════════════════════════════════
         Display Preferences
         ══════════════════════════════════════════════════════ -->
    <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden transition-colors duration-200">
      <div class="px-5 pt-5 pb-4 border-b border-garden-border flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-garden-base flex items-center justify-center text-lg flex-shrink-0">🎨</div>
        <div>
          <div class="text-sm font-extrabold text-garden-text">Display Preferences</div>
          <div class="text-[11px] text-garden-dim mt-0.5 font-medium">Adjust how data and the interface appear.</div>
        </div>
      </div>

      <div class="p-5 space-y-5">

        <!-- Dark mode -->
        <div>
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-sm font-bold text-garden-text">Dark Mode</div>
              <div class="text-[11px] text-garden-dim mt-0.5">Switch to a dark green palette suited for low-light use.</div>
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
            Displayed values are converted from raw °C stored by the sensors.<span v-if="unit === 'F'"> Stored data remains in °C.</span>
          </p>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         About
         ══════════════════════════════════════════════════════ -->
    <div class="px-5 py-4 rounded-2xl border border-garden-border bg-garden-surface flex items-center justify-between transition-colors duration-200">
      <div>
        <div class="text-xs font-bold text-garden-text">e-Tanim System</div>
        <div class="font-mono text-[10px] text-garden-dim mt-0.5">v2.4.1 · Off-grid IoT · ESP32 + Mini PC</div>
      </div>
      <span class="text-[10px] font-semibold text-garden-dim bg-garden-base px-2 py-1 rounded-full">
        Lowland + Highland
      </span>
    </div>
  </div>
</template>

<script setup>
import { useDarkMode } from '@/composables/useDarkMode'
import { useTempUnit } from '@/composables/useTempUnit'

const { isDarkMode, toggleDarkMode } = useDarkMode()

// Temperature unit is a shared, localStorage-persisted preference (see
// useTempUnit) so every view converts the same way. It only affects how
// Celsius sensor readings are displayed — thresholds and Firebase/ESP32
// data stay in Celsius.
const { tempUnit: unit, setTempUnit } = useTempUnit()
</script>