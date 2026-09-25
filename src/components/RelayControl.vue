<template>
  <!-- ── Viewer read-only state ───────────────────────────────────────────── -->
  <div v-if="readonly" class="bg-garden-surface rounded-2xl border shadow-sm overflow-hidden" :style="{ borderColor: accentBorder }">
    <div class="h-1" :style="{ backgroundColor: accent }" />
    <div class="p-4 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-medium uppercase tracking-widest text-garden-dim">Relay Status</span>
        <span
          class="px-2.5 py-1 rounded-full text-[10px] font-semibold border"
          :class="relayOn
            ? 'bg-garden-danger/15 text-garden-danger border-garden-danger/40'
            : 'bg-garden-base text-garden-dim border-garden-border'"
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
  <div v-else class="bg-garden-surface rounded-2xl border shadow-sm overflow-hidden" :style="{ borderColor: accentBorder }">
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
            :class="modePillClass"
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
        <div v-if="countdown > 0" class="flex flex-col items-center py-3 rounded-xl bg-garden-danger/10 border border-garden-danger/40">
          <div class="text-[10px] font-medium tracking-widest uppercase text-garden-danger/70 mb-1">
            Auto-Off In
          </div>
          <div class="text-4xl font-bold font-mono text-garden-danger tracking-tight">
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
        <div class="flex items-start gap-2 p-2.5 rounded-xl bg-garden-warn/10 border-garden-warn/30">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p class="text-[11px] text-garden-warn font-semibold leading-snug">
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
                       text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary
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
                       text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary
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
        <div class="relative bg-garden-surface rounded-2xl shadow-2xl w-full max-w-xs border border-garden-danger/40 z-10" @click.stop>
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
                🌡️ Temperature: {{ celsiusToDisplay(sensorValues.temperature) }}{{ unitLabel }} (below {{ celsiusToDisplay(getComputedWarningThresholds().temperatureWarn) }}{{ unitLabel }})
              </li>
              <li v-if="warningReasons.humidity" class="text-xs font-mono text-garden-danger">
                💧 Humidity: {{ sensorValues.humidity }}% (above {{ getComputedWarningThresholds().humidityWarn }}%)
              </li>
            </ul>
            <p class="text-sm text-garden-dim italic">Proceed anyway?</p>
          </div>
          <div class="flex gap-2.5 px-5 pb-5">
            <button class="flex-1 py-2.5 rounded-xl border border-garden-border bg-garden-surface text-garden-text font-medium text-sm hover:opacity-80 transition" @click="closeWarning">Cancel</button>
            <button class="flex-1 py-2.5 rounded-xl bg-[#dc2626] text-white font-semibold text-sm hover:bg-[#b91c1c] transition" @click="proceedOverride">Proceed</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Settings Modal -->
    <Teleport to="body">
      <div v-if="showSettings" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click="closeSettings">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div class="relative bg-garden-surface rounded-2xl shadow-2xl w-full max-w-xs border border-garden-border z-10 max-h-[85vh] overflow-y-auto" @click.stop>
          <div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-garden-border sticky top-0 bg-garden-surface">
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
            <!-- Irrigation pumps (lowland / highland): temperature & moisture thresholds -->
            <template v-if="thresholdCfg?.kind === 'irrigation'">
              <div class="space-y-3">
                <h4 class="text-[11px] font-medium uppercase tracking-widest text-garden-dim">Auto Mode — Temperature</h4>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Temp ON ({{ unitLabel }}) — relay turns on above this</label>
                  <input v-model.number="tempOnDisplay" type="number" step="0.5"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Temp OFF ({{ unitLabel }}) — relay turns off below this</label>
                  <input v-model.number="tempOffDisplay" type="number" step="0.5"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary" />
                </div>
              </div>

              <div class="space-y-3">
                <h4 class="text-[11px] font-medium uppercase tracking-widest text-garden-dim">Auto Mode — Soil Moisture</h4>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Moisture ON (%) — relay turns on when soil drops below this</label>
                  <input v-model.number="editThresholds.moistureOn" type="number" min="0" max="100"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Moisture OFF (%) — relay turns off when soil rises above this</label>
                  <input v-model.number="editThresholds.moistureOff" type="number" min="0" max="100"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary" />
                </div>
              </div>

              <div class="rounded-xl bg-garden-good/10 border-garden-good/30 p-3">
                <p class="text-xs text-garden-good leading-snug">ⓘ Warning thresholds are automatically set to ON thresholds. Warnings show when soil moisture or temperature are unfavorable during manual override.</p>
              </div>
            </template>

            <!-- Misting: temperature & humidity thresholds -->
            <template v-else-if="thresholdCfg?.kind === 'misting'">
              <div class="space-y-3">
                <h4 class="text-[11px] font-medium uppercase tracking-widest text-garden-dim">Auto Mode — Misting</h4>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Temp ON ({{ unitLabel }}) — misting starts above this</label>
                  <input v-model.number="tempOnDisplay" type="number" step="0.5"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Humidity ON (%) — misting starts above this</label>
                  <input v-model.number="editThresholds.humidityOn" type="number" min="0" max="100"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary" />
                </div>
              </div>
            </template>
          </div>

          <div class="flex gap-2 px-5 pb-5 sticky bottom-0 bg-garden-surface pt-2">
            <button class="px-3 py-2.5 rounded-xl bg-garden-warn text-white font-medium text-xs hover:opacity-85 transition" @click="resetThresholds">↺ Reset</button>
            <button class="flex-1 py-2.5 rounded-xl border border-garden-border bg-garden-surface text-garden-text font-medium text-sm hover:opacity-80 transition" @click="closeSettings">Cancel</button>
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
import { expireRelay } from '@/composables/useRelayAutoOff'
import { isDarkMode }  from '@/composables/useDarkMode'
import { useTempUnit } from '@/composables/useTempUnit'

const { unitLabel, celsiusToDisplay, displayToCelsius } = useTempUnit()

const props = defineProps({
  currentMoisture:       { type: Number, default: null },
  currentTemperature:    { type: Number, default: null },
  currentHumidity:       { type: Number, default: null },
  readonly:              { type: Boolean, default: false },
  controlPath:           { type: String, default: 'control/relay_lowland' },
  title:                 { type: String, default: 'Relay Override' },
  showThresholdSettings: { type: Boolean, default: true },
  pumpNumber:            { type: Number, default: 1 },
})

// Accent color per pump (matches Figma's per-zone accent pattern).
// accentBorder used to be a fixed bright pastel (#86efac / #93c5fd) that
// was way too intense on the dark surface — alpha-blend the same accent
// instead, dialed back further in dark mode.
const accent       = computed(() => props.pumpNumber === 1 ? '#2d7a4f' : '#3b9dd2')
const accentBorder = computed(() =>
  props.pumpNumber === 1
    ? `rgba(45, 122, 79, ${isDarkMode.value ? 0.35 : 0.55})`
    : `rgba(59, 157, 210, ${isDarkMode.value ? 0.35 : 0.55})`
)
const modePillClass = computed(() => {
  if (relayOn.value) return 'bg-garden-danger/15 text-garden-danger border-garden-danger/40'
  if (props.showThresholdSettings) return 'bg-garden-good/15 text-garden-good border-garden-good/40'
  return 'bg-garden-base text-garden-dim border-garden-border'
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
const sensorValues     = ref({ moisture: null, temperature: null, humidity: null })

// Per-pump threshold config. Paths must match database.rules.json:
//   config/thresholds, config/thresholds_highland, config/misting (each with a
//   sibling *_updated change marker the ESP32 polls).
// Defaults are PROVISIONAL — keep in sync with the firmware constants.
const IRRIGATION_DEFAULTS = { tempOn: 40, tempOff: 15, moistureOn: 30, moistureOff: 60 }
const THRESHOLD_CONFIG = {
  1: { path: 'config/thresholds',          kind: 'irrigation', defaults: IRRIGATION_DEFAULTS },
  2: { path: 'config/thresholds_highland', kind: 'irrigation', defaults: IRRIGATION_DEFAULTS },
  4: { path: 'config/misting',             kind: 'misting',    defaults: { tempOn: 32, humidityOn: 70 } },
}
const thresholdCfg = THRESHOLD_CONFIG[props.pumpNumber] ?? null   // pump 3 (fertilizer) has none
const isIrrigation = thresholdCfg?.kind === 'irrigation'

const thresholds = ref({ ...(thresholdCfg?.defaults ?? {}) })
const editThresholds = ref({ ...thresholds.value })

// editThresholds.tempOn/tempOff always stay in Celsius (that's what's saved
// to Firebase and compared against by the ESP32). These give the inputs a
// view/edit surface in whichever unit the user picked, converting back to
// Celsius on write.
const tempOnDisplay = computed({
  get: () => celsiusToDisplay(editThresholds.value.tempOn),
  set: (value) => { editThresholds.value.tempOn = displayToCelsius(value) },
})
const tempOffDisplay = computed({
  get: () => celsiusToDisplay(editThresholds.value.tempOff),
  set: (value) => { editThresholds.value.tempOff = displayToCelsius(value) },
})

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
  }
}

// Get computed warning thresholds (irrigation pumps only)
function getComputedWarningThresholds() {
  if (!isIrrigation) return {}
  return {
    moistureWarn:    thresholds.value.moistureOn,  // Warn at ON threshold
    temperatureWarn: thresholds.value.tempOn,      // Warn at ON threshold
    humidityWarn:    50,                            // Fixed value
  }
}

function checkUnfavorableConditions() {
  if (!isIrrigation) return false  // only irrigation pumps show unfavorable-condition warnings

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
    if (!thresholdCfg) return
    const snapshot = await get(dbRef(db, thresholdCfg.path))
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
    if (!thresholdCfg) return
    // Save only the editable fields for this pump's kind
    const t = editThresholds.value
    const dataToSave = isIrrigation
      ? { tempOn: t.tempOn, tempOff: t.tempOff, moistureOn: t.moistureOn, moistureOff: t.moistureOff }
      : { tempOn: t.tempOn, humidityOn: t.humidityOn }
    await set(dbRef(db, thresholdCfg.path), dataToSave)
    await set(dbRef(db, `${thresholdCfg.path}_updated`), Math.floor(Date.now() / 1000))
    thresholds.value     = { ...editThresholds.value }
    loading.value        = false
    showSettings.value   = false
    // Values are logged in Celsius (the stored unit) so entries read the same
    // whichever display unit was selected when they were written.
    const c = (v) => +Number(v).toFixed(1)
    const summary = isIrrigation
      ? `temp on ${c(t.tempOn)}°C / off ${c(t.tempOff)}°C, moisture on ${c(t.moistureOn)}% / off ${c(t.moistureOff)}%`
      : `temp ≥ ${c(t.tempOn)}°C, humidity ≥ ${c(t.humidityOn)}%`
    logActivity(`${props.title} auto-mode thresholds updated: ${summary}`, '#3b9dd2', 'threshold')
  } catch (err) {
    loading.value = false
    console.error(`Failed to save thresholds for pump ${props.pumpNumber}:`, err)
    alert(`Failed to save thresholds. Check console for errors.`)
  }
}

async function resetThresholds() {
  if (!thresholdCfg) return
  const defaultThresholds = thresholdCfg.defaults
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
      await expireRelay(props.controlPath)   // turns off and logs once, even if the app-level watcher fires too
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