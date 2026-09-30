<template>
  <!-- ── Viewer read-only state ───────────────────────────────────────────── -->
  <div v-if="readonly" class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden">
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
  <div v-else class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden flex flex-col">

    <!-- flex-1 + flex-col so the body fills the card when it is stretched to match a taller neighbour;
         the action button is pinned to the bottom with mt-auto -->
    <div :class="[variant.pad, 'flex-1 flex flex-col']">
      <!-- Header (labels follow the Figma design per control type) -->
      <div class="flex items-center justify-between mb-4 gap-2">
        <!-- Irrigation zones -->
        <div v-if="variant.kind === 'irrigation'" class="flex items-center gap-2 min-w-0">
          <span class="text-lg">{{ variant.emoji }}</span>
          <div class="min-w-0">
            <div class="text-sm text-garden-text truncate">{{ variant.heading }}</div>
          </div>
        </div>
        <!-- Fertilizer / misting -->
        <div v-else class="min-w-0">
          <h3 class="text-sm font-extrabold text-garden-text">{{ variant.heading }}</h3>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            v-if="props.showThresholdSettings"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-garden-dim hover:bg-garden-base hover:text-garden-primary transition-colors flex-shrink-0"
            :title="variant.gearTitle"
            @click="showSettings = true"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- ── FORCED ON body ─────────────────────────────────────────────── -->
      <div v-if="relayOn" class="flex-1 flex flex-col gap-4">
        <!-- Countdown -->
        <div v-if="countdown > 0" class="my-auto flex flex-col items-center py-3 rounded-xl border" :class="variant.countdownBox">
          <div class="text-[10px] tracking-widest uppercase mb-1" :class="variant.countdownLabel">
            Auto-Off In
          </div>
          <div class="text-4xl font-extrabold font-mono tracking-tight" :class="variant.countdownText">
            {{ formattedCountdown }}
          </div>
        </div>

        <!-- Turn OFF button -->
        <button
          class="w-full py-3 rounded-xl text-white font-extrabold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          :class="[variant.offBtn, countdown > 0 ? '' : 'mt-auto']"
          :disabled="loading"
          @click="handleClick"
        >
          {{ loading ? 'Sending…' : variant.offLabel }}
        </button>
      </div>

      <!-- ── Idle body ───────────────────────────────────────────────────── -->
      <div v-else class="flex-1 flex flex-col gap-4">
        <!-- Duration inputs (my-auto: extra card height is split evenly above/below) -->
        <div class="my-auto">
          <div class="text-[10px] font-extrabold tracking-widest uppercase text-garden-dim mb-2">Duration</div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5 flex-1">
              <input
                v-model.number="inputMinutes"
                type="number" min="0" max="99" placeholder="0"
                class="w-full px-3 py-2.5 rounded-xl border border-garden-border text-center text-lg font-mono
                       text-garden-text bg-garden-void focus:outline-none focus:ring-2 transition"
                :class="variant.focus"
              />
              <span class="text-xs font-bold text-garden-dim flex-shrink-0">MIN</span>
            </div>
            <span class="text-xl text-garden-dim flex-shrink-0">:</span>
            <div class="flex items-center gap-1.5 flex-1">
              <input
                v-model.number="inputSeconds"
                type="number" min="0" max="59" placeholder="0"
                class="w-full px-3 py-2.5 rounded-xl border border-garden-border text-center text-lg font-mono
                       text-garden-text bg-garden-void focus:outline-none focus:ring-2 transition"
                :class="variant.focus"
              />
              <span class="text-xs font-bold text-garden-dim flex-shrink-0">SEC</span>
            </div>
          </div>
          <span v-if="durationError" class="block text-[11px] text-garden-danger mt-1.5">{{ durationError }}</span>
        </div>

        <!-- Turn ON button -->
        <button
          class="w-full py-3 rounded-xl font-extrabold text-sm text-white transition-colors shadow-sm
                 disabled:opacity-40 disabled:cursor-not-allowed"
          :style="{ backgroundColor: accent }"
          :disabled="loading"
          @click="handleClick"
        >
          {{ loading ? 'Sending…' : variant.onLabel }}
        </button>
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
          </div>bold
          <div class="p-5 space-y-3">
            <p class="text-sm text-garden-text">Current conditions may harm the plants:</p>
            <ul class="space-y-2">
              <li v-if="warningReasons.overWet" class="text-xs font-mono text-garden-danger">
                🌱 Soil Moisture: {{ sensorValues.moisture }}% (at or above the {{ thresholds.smStop }}% stop point — overwatering risk)
              </li>
              <li v-if="warningReasons.notNeeded" class="text-xs font-mono text-garden-danger">
                💨 VPD: {{ sensorValues.vpd ?? '—' }} kPa (below the {{ thresholds.vpdGate }} kPa gate, moisture above the {{ thresholds.smNormal }}% normal-start point — conditions don't call for irrigation right now)
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
            <!-- Irrigation pumps (lowland / highland): VPD-gated state-machine breakpoints,
                 per decision log item 1/2 and DOC-CAP §2.3/2.5. Soil moisture (% of field
                 capacity) is checked against three breakpoints; VPD gates a Normal start
                 but never stops a running session. -->
            <template v-if="thresholdCfg?.kind === 'irrigation'">
              <div class="space-y-3">
                <h4 class="text-[11px] font-medium uppercase tracking-widest text-garden-dim">Auto Mode — Soil Moisture Breakpoints (% FC)</h4>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Normal start — waters when moisture is at or below this AND VPD gate is met</label>
                  <input v-model.number="editThresholds.smNormal" type="number" min="0" max="100"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Emergency start — waters immediately regardless of VPD</label>
                  <input v-model.number="editThresholds.smEmergency" type="number" min="0" max="100"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">Stop — session ends when moisture reaches or exceeds this</label>
                  <input v-model.number="editThresholds.smStop" type="number" min="0" max="100"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary" />
                </div>
              </div>

              <div class="space-y-3">
                <h4 class="text-[11px] font-medium uppercase tracking-widest text-garden-dim">Auto Mode — VPD Gate</h4>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-garden-text block">VPD gate (kPa) — a Normal start also needs VPD at or above this</label>
                  <input v-model.number="editThresholds.vpdGate" type="number" min="0" max="5" step="0.1"
                    class="w-full px-3 py-2 rounded-xl border border-garden-border font-mono text-sm text-garden-text bg-garden-void focus:outline-none focus:border-garden-primary" />
                </div>
              </div>

              <div class="rounded-xl bg-garden-good/10 border-garden-good/30 p-3">
                <p class="text-xs text-garden-good leading-snug">ⓘ Emergency moisture starts a session regardless of VPD, and VPD never stops a running session — it only gates a Normal start. Warnings during manual override show when the current reading doesn't call for irrigation.</p>
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
import { useTempUnit } from '@/composables/useTempUnit'

const { unitLabel, celsiusToDisplay, displayToCelsius } = useTempUnit()

const props = defineProps({
  currentMoisture:       { type: Number, default: null },
  currentTemperature:    { type: Number, default: null },
  currentHumidity:       { type: Number, default: null },
  currentVpd:            { type: Number, default: null },
  readonly:              { type: Boolean, default: false },
  controlPath:           { type: String, default: 'control/relay_lowland' },
  title:                 { type: String, default: 'Relay Override' },
  showThresholdSettings: { type: Boolean, default: true },
  pumpNumber:            { type: Number, default: 1 },
})

// Which Activity Log category this control belongs to — read straight off
// controlPath, since that's the exact, already-known source of truth for
// what this control is, rather than re-guessing it from message text later.
const logCategory = computed(() => {
  if (props.controlPath === 'control/relay_mist') return 'misting'
  if (props.controlPath === 'control/relay_fert') return 'fertilization'
  return 'irrigation' // control/relay_lowland, control/relay_highland
})

// Per-control look and labels, following the Figma design:
//   pump 1 = Lowland irrigation (red), pump 2 = Highland irrigation (green),
//   pump 3 = Fertilizer (brown/amber), pump 4 = Misting (blue).
// `title` (prop) is still what gets written to the Activity Log — these are
// display-only labels.
const IRRIGATION_LOOK = {
  kind: 'irrigation', pad: 'p-4', eyebrow: 'Irrigation Zone',
  gearTitle: 'Adjust zone thresholds',
  onLabel: '▶ Turn Relay ON', offLabel: 'Turn Relay OFF',
  countdownBox: 'bg-garden-danger/10 border-garden-danger/40',
  countdownLabel: 'text-garden-danger/70', countdownText: 'text-garden-danger',
  offBtn: 'bg-[#dc2626] hover:bg-[#b91c1c]',
  focus: 'focus:border-garden-primary focus:ring-garden-primary/20',
}
const VARIANTS = {
  1: { ...IRRIGATION_LOOK, accent: '#dc2626', emoji: '🍅🍆', heading: 'Lowland Zone' },
  2: { ...IRRIGATION_LOOK, accent: '#2d7a4f', emoji: '🫑',   heading: 'Highland Zone' },
  3: {
    kind: 'fert', pad: 'p-4', accent: '#8b5e3c',
    heading: 'Fertilizer Pump Control', subtitle: 'Manual relay control',
    onLabel: '▶ Turn Relay ON', offLabel: 'Turn Relay OFF',
    countdownBox: 'bg-garden-warn/10 border-garden-warn/40',
    countdownLabel: 'text-garden-warn/70', countdownText: 'text-garden-warn',
    offBtn: 'bg-[#d97706] hover:bg-[#b45309]',
    focus: 'focus:border-[#8b5e3c] focus:ring-[#8b5e3c]/20',
  },
  4: {
    kind: 'mist', pad: 'p-4', accent: '#3b9dd2',
    heading: 'Manual Override', gearTitle: 'Adjust misting thresholds',
    onLabel: '▶ Start Misting', offLabel: 'Stop Misting',
    countdownBox: 'bg-garden-sky/10 border-garden-sky/40',
    countdownLabel: 'text-garden-sky/70', countdownText: 'text-garden-sky',
    offBtn: 'bg-[#3b9dd2] hover:bg-[#2980b9]',
    focus: 'focus:border-[#3b9dd2] focus:ring-[#3b9dd2]/20',
  },
}
const variant = computed(() => VARIANTS[props.pumpNumber] ?? VARIANTS[1])

const accent = computed(() => variant.value.accent)


// State
const relayOn          = ref(false)
const loading          = ref(false)
const inputMinutes     = ref(0)
const inputSeconds     = ref(30)
const countdown        = ref(0)
const durationError    = ref('')
const showWarningModal = ref(false)
const showSettings     = ref(false)
const warningReasons   = ref({ overWet: false, notNeeded: false })
const sensorValues     = ref({ moisture: null, temperature: null, humidity: null, vpd: null })

// Per-pump threshold config. Paths must match database.rules.json (legacy
// config/thresholds and config/thresholds_highland paths — not yet read by
// the firmware; see decision log flag F2/F6):
//   config/thresholds, config/thresholds_highland, config/misting (each with a
//   sibling *_updated change marker the ESP32 polls).
// Irrigation shape follows decision log items 1-2 and DOC-CAP §2.3/2.5: a
// per-zone soil-moisture (% field capacity) state machine (smNormal,
// smEmergency, smStop) gated by VPD (kPa) for a Normal start only. Defaults
// below match the §2.5 pin/threshold table and are PROVISIONAL — keep in
// sync with the firmware constants once it's updated to match (F2).
const LOWLAND_IRRIGATION_DEFAULTS  = { smNormal: 70, smEmergency: 60, smStop: 80, vpdGate: 0.6 }
const HIGHLAND_IRRIGATION_DEFAULTS = { smNormal: 75, smEmergency: 70, smStop: 80, vpdGate: 0.6 }
const THRESHOLD_CONFIG = {
  1: { path: 'config/thresholds',          kind: 'irrigation', defaults: LOWLAND_IRRIGATION_DEFAULTS },
  2: { path: 'config/thresholds_highland', kind: 'irrigation', defaults: HIGHLAND_IRRIGATION_DEFAULTS },
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
    vpd:         props.currentVpd,
  }
}

// Mirrors the evaluateZone() decision from decision log items 1-2 / DOC-CAP
// §2.3: a Normal start needs moisture at or below smNormal AND VPD at or
// above vpdGate; Emergency moisture waters regardless of VPD. A manual
// override is flagged "unfavorable" here only to warn the user, not to
// block them — the dashboard never runs the actual state machine.
function checkUnfavorableConditions() {
  if (!isIrrigation) return false  // only irrigation pumps show unfavorable-condition warnings

  updateSensorValues()
  const { moisture, vpd } = sensorValues.value
  const { smNormal, smEmergency, smStop } = thresholds.value
  const overWet   = moisture !== null && moisture >= smStop
  const emergency = moisture !== null && moisture <= smEmergency
  const notNeeded = !emergency && moisture !== null && moisture > smNormal &&
                     (vpd === null || vpd < thresholds.value.vpdGate)
  warningReasons.value = { overWet, notNeeded }
  return overWet || notNeeded
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
      ? { smNormal: t.smNormal, smEmergency: t.smEmergency, smStop: t.smStop, vpdGate: t.vpdGate }
      : { tempOn: t.tempOn, humidityOn: t.humidityOn }
    await set(dbRef(db, thresholdCfg.path), dataToSave)
    await set(dbRef(db, `${thresholdCfg.path}_updated`), Math.floor(Date.now() / 1000))
    thresholds.value     = { ...editThresholds.value }
    loading.value        = false
    showSettings.value   = false
    // Values are logged in Celsius/kPa (the stored units) so entries read the
    // same whichever display unit was selected when they were written.
    const c = (v) => +Number(v).toFixed(1)
    const summary = isIrrigation
      ? `moisture normal ≤${c(t.smNormal)}%, emergency ≤${c(t.smEmergency)}%, stop ≥${c(t.smStop)}%, VPD gate ≥${c(t.vpdGate)} kPa`
      : `temp ≥ ${c(t.tempOn)}°C, humidity ≥ ${c(t.humidityOn)}%`
    logActivity(`${props.title} auto-mode thresholds updated: ${summary}`, '#3b9dd2', 'threshold', { category: logCategory.value })
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
    logActivity(`${props.title} manually turned ON for ${formattedCountdown.value}`, '#22c55e', 'relay', { category: logCategory.value, manual: true })
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
    logActivity(`${props.title} manually turned OFF`, '#94a3b8', 'relay', { category: logCategory.value, manual: true })
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