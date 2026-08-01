<template>
  <!-- ── Viewer read-only state ───────────────────────────────────────────── -->
  <div v-if="readonly" class="bg-white rounded-2xl border shadow-sm overflow-hidden" :style="{ borderColor: accentBorder }">
    <div class="h-1" :style="{ backgroundColor: accent }" />
    <div class="p-4 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-medium uppercase tracking-widest text-garden-dim">Relay Status</span>
        <span
          class="px-2.5 py-1 rounded-full text-[10px] font-semibold border"
          :style="relayOn
            ? { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }
            : { backgroundColor: '#eef3f0', color: '#6b8070', borderColor: '#d8e8de' }"
        >{{ relayOn ? 'ACTIVE' : 'INACTIVE' }}</span>
      </div>
      <p class="text-[11px] text-garden-dim leading-snug">
        {{ relayOn
          ? 'The relay is currently active. Watering in progress.'
          : 'Relay is off. Awaiting next watering cycle.' }}
      </p>
    </div>
  </div>

  <!-- ── Admin full control ───────────────────────────────────────────────── -->
  <div v-else class="bg-white rounded-2xl border shadow-sm overflow-hidden" :style="{ borderColor: accentBorder }">
    <!-- Top accent strip -->
    <div class="h-1" :style="{ backgroundColor: accent }" />

    <div class="p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 gap-2">
        <div class="min-w-0">
          <div class="text-[10px] font-medium tracking-widest uppercase text-garden-dim">
            Pump {{ props.pumpNumber }} Override
          </div>
          <div class="text-sm font-semibold text-garden-text truncate">{{ props.title }}</div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span
            class="px-2.5 py-1 rounded-full text-[10px] font-semibold border"
            :style="modePillStyle"
          >{{ relayOn ? 'FORCED ON' : (props.showThresholdSettings ? 'AUTO' : 'OFF') }}</span>
          <button
            v-if="props.showThresholdSettings"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-garden-dim hover:bg-garden-base hover:text-garden-primary transition-colors"
            title="Configure thresholds"
            @click="showSettings = true"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- ── FORCED ON body ─────────────────────────────────────────────── -->
      <div v-if="relayOn" class="space-y-3">
        <!-- Countdown -->
        <div v-if="countdown > 0" class="flex flex-col items-center py-3 rounded-xl bg-[#fee2e2] border border-[#fca5a5]">
          <div class="text-[10px] font-medium tracking-widest uppercase text-[#dc2626]/70 mb-1">
            Auto-Off In
          </div>
          <div class="text-4xl font-bold font-mono text-[#dc2626] tracking-tight">
            {{ formattedCountdown }}
          </div>
        </div>

        <!-- Turn OFF button -->
        <button
          class="w-full py-3 rounded-xl bg-[#dc2626] text-white font-semibold text-sm
                 hover:bg-[#b91c1c] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="handleClick"
        >
          {{ loading ? 'Sending…' : 'Turn Relay OFF' }}
        </button>

        <!-- Warning strip -->
        <div class="flex items-start gap-2 p-2.5 rounded-xl bg-[#fff7ed] border border-[#fed7aa]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p class="text-[11px] text-[#9a3412] font-semibold leading-snug">
            {{ props.showThresholdSettings
              ? 'Relay is active. ESP32 is ignoring temperature thresholds.'
              : 'Relay is active and will turn off automatically after the countdown.' }}
          </p>
        </div>
      </div>

      <!-- ── Idle body ───────────────────────────────────────────────────── -->
      <div v-else class="space-y-3">
        <!-- Duration inputs -->
        <div>
          <div class="text-[10px] font-medium tracking-widest uppercase text-garden-dim mb-2">Duration</div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5 flex-1">
              <input
                v-model.number="inputMinutes"
                type="number" min="0" max="99" placeholder="0"
                class="w-full px-3 py-2.5 rounded-xl border border-garden-border text-center text-lg font-medium font-mono
                       text-garden-text bg-[#f4f8f5] focus:outline-none focus:border-garden-primary
                       focus:ring-2 focus:ring-garden-primary/20 transition"
              />
              <span class="text-xs font-medium text-garden-dim flex-shrink-0">MIN</span>
            </div>
            <span class="text-xl font-medium text-garden-dim flex-shrink-0">:</span>
            <div class="flex items-center gap-1.5 flex-1">
              <input
                v-model.number="inputSeconds"
                type="number" min="0" max="59" placeholder="0"
                class="w-full px-3 py-2.5 rounded-xl border border-garden-border text-center text-lg font-medium font-mono
                       text-garden-text bg-[#f4f8f5] focus:outline-none focus:border-garden-primary
                       focus:ring-2 focus:ring-garden-primary/20 transition"
              />
              <span class="text-xs font-medium text-garden-dim flex-shrink-0">SEC</span>
            </div>
          </div>
          <span v-if="durationError" class="block text-[11px] text-garden-danger mt-1.5">{{ durationError }}</span>
        </div>

        <!-- Turn ON button -->
        <button
          class="w-full py-3 rounded-xl font-semibold text-sm text-white transition-colors shadow-sm
                 disabled:opacity-40 disabled:cursor-not-allowed"
          :style="{ backgroundColor: accent }"
          :disabled="loading"
          @click="handleClick"
        >
          {{ loading ? 'Sending…' : '▶ Turn Relay ON' }}
        </button>

        <!-- Hint -->
        <p class="text-[11px] text-garden-dim text-center leading-snug">
          Set a duration then click ON. Relay will auto-off when timer expires.
        </p>
      </div>
    </div>

    <!-- Warning Modal -->
    <Teleport to="body">
      <div v-if="showWarningModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click="closeWarning">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs border border-[#fca5a5] z-10" @click.stop>
          <div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-garden-border">
            <h3 class="text-base font-semibold text-garden-text">⚠️ Unfavorable Conditions</h3>
            <button
              class="w-8 h-8 rounded-full bg-garden-base flex items-center justify-center text-garden-dim hover:bg-garden-border transition-colors"
              @click="closeWarning"
            >✕</button>
          </div>
          <div class="p-5 space-y-3">
            <p class="text-sm text-garden-text">Current conditions may harm the plants:</p>
            <ul class="space-y-2">
              <li v-if="warningReasons.moisture" class="text-xs font-mono text-garden-danger">
                🌱 Soil Moisture: {{ sensorValues.moisture }}% (above {{ getComputedWarningThresholds().moistureWarn }}%)
              </li>
              <li v-if="warningReasons.temperature" class="text-xs font-mono text-garden-danger">
                🌡️ Temperature: {{ sensorValues.temperature }}°C (below {{ getComputedWarningThresholds().temperatureWarn }}°C)
              </li>
              <li v-if="warningReasons.humidity" class="text-xs font-mono text-garden-danger">
                💧 Humidity: {{ sensorValues.humidity }}% (above {{ getComputedWarningThresholds().humidityWarn }}%)
              </li>
            </ul>
            <p class="text-sm text-garden-dim italic">Proceed anyway?</p>
          </div>
          <div class="flex gap-2.5 px-5 pb-5">
            <button class="flex-1 py-2.5 rounded-xl border border-garden-border bg-white text-garden-text font-medium text-sm hover:opacity-80 transition" @click="closeWarning">Cancel</button>
            <button class="flex-1 py-2.5 rounded-xl bg-[#dc2626] text-white font-semibold text-sm hover:bg-[#b91c1c] transition" @click="proceedOverride">Proceed</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Settings Modal -->
    <Teleport to="body">
      <div v-if="showSettings" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click="closeSettings">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs border border-garden-border z-10 max-h-[85vh] overflow-y-auto" @click.stop>
          <div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-garden-border sticky top-0 bg-white">
            <div>
              <div class="text-[10px] font-medium text-garden-dim uppercase tracking-widest mb-0.5">Settings</div>
              <h3 class="text-base font-semibold text-garden-text">Threshold Settings — Pump {{ props.pumpNumber }}</h3>
            </div>
            <button
              class="w-8 h-8 rounded-full bg-garden-base flex items-center justify-center text-garden-dim hover:bg-garden-border transition-colors flex-shrink-0"
              @click="closeSettings"
            >✕</button>
          </div>

          <div class="p-5 space-y-5">
            <!-- Pump 1: Temperature & Moisture Thresholds -->
            <template v-if="props.pumpNumber === 1">
              <div class="space-y-3">
                <h4 class="text-[11px] font-medium uppercase tracking-widest text-garden-dim">Auto Mode — Temperature</h4>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Temp ON (°C) — relay turns on above this</label>
                  <input v-model.number="editThresholds.tempOn" type="number" step="0.5"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-[#f4f8f5] focus:outline-none focus:border-garden-primary" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Temp OFF (°C) — relay turns off below this</label>
                  <input v-model.number="editThresholds.tempOff" type="number" step="0.5"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-[#f4f8f5] focus:outline-none focus:border-garden-primary" />
                </div>
              </div>

              <div class="space-y-3">
                <h4 class="text-[11px] font-medium uppercase tracking-widest text-garden-dim">Auto Mode — Soil Moisture</h4>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Moisture ON (%) — relay turns on when soil drops below this</label>
                  <input v-model.number="editThresholds.moistureOn" type="number" min="0" max="100"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-[#f4f8f5] focus:outline-none focus:border-garden-primary" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Moisture OFF (%) — relay turns off when soil rises above this</label>
                  <input v-model.number="editThresholds.moistureOff" type="number" min="0" max="100"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-[#f4f8f5] focus:outline-none focus:border-garden-primary" />
                </div>
              </div>

              <div class="rounded-xl bg-[#dcfce7] border border-[#86efac] p-3">
                <p class="text-xs text-[#15803d] leading-snug">ⓘ Warning thresholds are automatically set to ON thresholds. Warnings show when soil moisture or temperature are unfavorable during manual override.</p>
              </div>
            </template>

            <!-- Pump 2: TDS Thresholds Only -->
            <template v-else>
              <div class="space-y-3">
                <h4 class="text-[11px] font-medium uppercase tracking-widest text-garden-dim">Auto Mode — TDS (Total Dissolved Solids)</h4>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">TDS ON — relay turns on below this value</label>
                  <input v-model.number="editThresholds.tdsOn" type="number" min="0"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-[#f4f8f5] focus:outline-none focus:border-garden-primary" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">TDS OFF — relay turns off above this value</label>
                  <input v-model.number="editThresholds.tdsOff" type="number" min="0"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-[#f4f8f5] focus:outline-none focus:border-garden-primary" />
                </div>
              </div>
            </template>
          </div>

          <div class="flex gap-2 px-5 pb-5 sticky bottom-0 bg-white pt-2">
            <button class="px-3 py-2.5 rounded-xl bg-[#f59e0b] text-white font-medium text-xs hover:opacity-85 transition" @click="resetThresholds">↺ Reset</button>
            <button class="flex-1 py-2.5 rounded-xl border border-garden-border bg-white text-garden-text font-medium text-sm hover:opacity-80 transition" @click="closeSettings">Cancel</button>
            <button class="flex-1 py-2.5 rounded-xl text-white font-medium text-sm hover:opacity-90 transition" :style="{ backgroundColor: accent }" @click="saveThresholds">Save</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { db }                                     from '@/firebase'
import { ref as dbRef, set, update, onValue, get, off } from 'firebase/database'
import { logActivity } from '@/composables/useActivityLog'

const props = defineProps({
  currentMoisture:       { type: Number, default: null },
  currentTemperature:    { type: Number, default: null },
  currentHumidity:       { type: Number, default: null },
  currentTds:            { type: Number, default: null },
  readonly:              { type: Boolean, default: false },
  controlPath:           { type: String, default: 'control/relay' },
  title:                 { type: String, default: 'Relay Override' },
  showThresholdSettings: { type: Boolean, default: true },
  pumpNumber:            { type: Number, default: 1 },
})

// Accent color per pump (matches Figma's per-zone accent pattern)
const accent       = computed(() => props.pumpNumber === 1 ? '#2d7a4f' : '#3b9dd2')
const accentBorder = computed(() => props.pumpNumber === 1 ? '#86efac' : '#93c5fd')
const modePillStyle = computed(() => {
  if (relayOn.value) return { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }
  if (props.showThresholdSettings) return { backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac' }
  return { backgroundColor: '#eef3f0', color: '#6b8070', borderColor: '#d8e8de' }
})

// State
const relayOn          = ref(false)
const loading          = ref(false)
const inputMinutes     = ref(0)
const inputSeconds     = ref(30)
const countdown        = ref(0)
const durationError    = ref('')
const showWarningModal = ref(false)
const showSettings     = ref(false)
const warningReasons   = ref({ moisture: false, temperature: false, humidity: false })
const sensorValues     = ref({ moisture: null, temperature: null, humidity: null, tds: null })

// Default thresholds for Pump 1 (no warning thresholds - computed dynamically)
const defaultPump1Thresholds = {
  tempOn:      40,
  tempOff:     15,
  moistureOn:  30,
  moistureOff: 60,
}

// Default thresholds for Pump 2 (TDS only, no warnings)
const defaultPump2Thresholds = {
  tdsOn:  500,
  tdsOff: 700,
}

const thresholds = ref(props.pumpNumber === 1 ? { ...defaultPump1Thresholds } : { ...defaultPump2Thresholds })
const editThresholds = ref({ ...thresholds.value })

let unsubscribe    = null
let countdownTimer = null

// Computed
const formattedCountdown = computed(() => {
  const m = Math.floor(countdown.value / 60).toString().padStart(2, '0')
  const s = (countdown.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const totalSeconds = computed(() =>
  (inputMinutes.value || 0) * 60 + (inputSeconds.value || 0)
)

function updateSensorValues() {
  sensorValues.value = {
    moisture:    props.currentMoisture,
    temperature: props.currentTemperature,
    humidity:    props.currentHumidity,
    tds:         props.currentTds,
  }
}

// Get computed warning thresholds (for Pump 1 only)
function getComputedWarningThresholds() {
  if (props.pumpNumber !== 1) return {}
  return {
    moistureWarn:    thresholds.value.moistureOn,  // Warn at ON threshold
    temperatureWarn: thresholds.value.tempOn,      // Warn at ON threshold
    humidityWarn:    50,                            // Fixed value
  }
}

function checkUnfavorableConditions() {
  if (props.pumpNumber !== 1) return false  // Pump 2 has no warnings

  updateSensorValues()
  const computedWarnings = getComputedWarningThresholds()
  const reasons = {
    moisture:    sensorValues.value.moisture    !== null && sensorValues.value.moisture    > computedWarnings.moistureWarn,
    temperature: sensorValues.value.temperature !== null && sensorValues.value.temperature < computedWarnings.temperatureWarn,
    humidity:    sensorValues.value.humidity    !== null && sensorValues.value.humidity    > computedWarnings.humidityWarn,
  }
  return Object.values(reasons).some(r => r)
}

// Companion path that stores the epoch-ms timestamp this relay should
// auto-off at. Written alongside the relay boolean so that any component
// instance (even a fresh mount after page navigation) can compute the
// true remaining time instead of restarting the countdown from scratch.
const offAtPath = computed(() => `${props.controlPath}_off_at`)

async function writeRelay(value, offAt = null) {
  try {
    await update(dbRef(db), {
      [props.controlPath]: value,
      [offAtPath.value]:   value ? offAt : null,
    })
    return true
  } catch (err) {
    console.error('Relay write failed:', err)
    return false
  }
}

async function loadThresholds() {
  try {
    const path = props.pumpNumber === 1 ? 'config/thresholds' : 'config/thresholds_pump2'
    const snapshot = await get(dbRef(db, path))
    if (snapshot.exists()) {
      thresholds.value     = { ...thresholds.value, ...snapshot.val() }
      editThresholds.value = { ...thresholds.value }
    }
  } catch (err) {
    console.error(`Failed to load thresholds for pump ${props.pumpNumber}:`, err)
  }
}

async function saveThresholds() {
  try {
    loading.value = true
    const path = props.pumpNumber === 1 ? 'config/thresholds' : 'config/thresholds_pump2'
    // Only save the editable fields (no warning thresholds for Pump 1)
    const dataToSave = props.pumpNumber === 1
      ? {
          tempOn: editThresholds.value.tempOn,
          tempOff: editThresholds.value.tempOff,
          moistureOn: editThresholds.value.moistureOn,
          moistureOff: editThresholds.value.moistureOff,
        }
      : {
          tdsOn: editThresholds.value.tdsOn,
          tdsOff: editThresholds.value.tdsOff,
        }
    await set(dbRef(db, path), dataToSave)
    await set(dbRef(db, `config/thresholds${props.pumpNumber === 1 ? '' : '_pump2'}_updated`), Math.floor(Date.now() / 1000))
    thresholds.value     = { ...editThresholds.value }
    loading.value        = false
    showSettings.value   = false
    logActivity(`${props.title} auto-mode thresholds updated`, '#3b9dd2', 'threshold')
  } catch (err) {
    loading.value = false
    console.error(`Failed to save thresholds for pump ${props.pumpNumber}:`, err)
    alert(`Failed to save thresholds. Check console for errors.`)
  }
}

async function resetThresholds() {
  const defaultThresholds = props.pumpNumber === 1 ? defaultPump1Thresholds : defaultPump2Thresholds
  const confirmed = confirm(`Reset Pump ${props.pumpNumber} thresholds to defaults?`)
  if (confirmed) {
    editThresholds.value = { ...defaultThresholds }
    await saveThresholds()
  }
}

function startCountdown(seconds) {
  clearInterval(countdownTimer)
  countdown.value = seconds

  countdownTimer = setInterval(async () => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      loading.value = true
      await writeRelay(false)
      loading.value = false
    }
  }, 1000)
}

async function turnOnRelay() {
  loading.value = true
  const offAt   = Date.now() + totalSeconds.value * 1000
  const ok      = await writeRelay(true, offAt)
  loading.value = false
  if (ok) {
    startCountdown(totalSeconds.value)
    logActivity(`${props.title} manually turned ON for ${formattedCountdown.value}`, '#22c55e', 'relay')
  }
}

function closeWarning() { showWarningModal.value = false }

async function proceedOverride() {
  showWarningModal.value = false
  await turnOnRelay()
}

function closeSettings() {
  editThresholds.value = { ...thresholds.value }
  showSettings.value   = false
}

async function handleClick() {
  durationError.value = ''

  if (!relayOn.value) {
    if (totalSeconds.value <= 0) {
      durationError.value = 'Set a duration greater than 0.'
      return
    }
    if (props.showThresholdSettings && checkUnfavorableConditions()) {
      const computedWarnings = getComputedWarningThresholds()
      warningReasons.value = {
        moisture:    sensorValues.value.moisture    > computedWarnings.moistureWarn,
        temperature: sensorValues.value.temperature < computedWarnings.temperatureWarn,
        humidity:    sensorValues.value.humidity    > computedWarnings.humidityWarn,
      }
      showWarningModal.value = true
      return
    }
    await turnOnRelay()
  } else {
    clearInterval(countdownTimer)
    countdown.value = 0
    loading.value   = true
    await writeRelay(false)
    loading.value   = false
    logActivity(`${props.title} manually turned OFF`, '#94a3b8', 'relay')
  }
}

// When the relay is ON but this component instance has no local timer
// running (fresh mount, page navigation, tab reopened), fetch the shared
// off-at timestamp from Firebase and resume the countdown from the true
// remaining time — rather than restarting it from the duration inputs.
async function resumeCountdownFromServer() {
  try {
    const snap  = await get(dbRef(db, offAtPath.value))
    const offAt = snap.exists() ? snap.val() : null

    if (typeof offAt === 'number') {
      const remainingMs = offAt - Date.now()
      if (remainingMs > 0) {
        startCountdown(Math.ceil(remainingMs / 1000))
        return
      }
      // Timer already expired while we were away — turn the relay off now.
      loading.value = true
      await writeRelay(false)
      loading.value = false
      return
    }
  } catch (err) {
    console.error(`Failed to resume countdown for ${props.controlPath}:`, err)
  }

  // No off-at on record (e.g. relay was flipped on outside the app) —
  // fall back to a best-effort countdown using the current duration inputs.
  startCountdown(totalSeconds.value > 0 ? totalSeconds.value : 30)
}

onMounted(() => {
  if (props.showThresholdSettings) {
    loadThresholds()
  }

  const controlRef = dbRef(db, props.controlPath)
  unsubscribe = onValue(controlRef, (snapshot) => {
    const val  = snapshot.val()
    relayOn.value = val === true

    if (relayOn.value && countdown.value <= 0) {
      resumeCountdownFromServer()
    }

    if (!relayOn.value && countdownTimer) {
      clearInterval(countdownTimer)
      countdown.value = 0
    }
  })
})

onUnmounted(() => {
  if (unsubscribe)    unsubscribe()
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>