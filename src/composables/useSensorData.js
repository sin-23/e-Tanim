// src/composables/useSensorData.js
//
// e-Tanim data model: THREE physical sensor nodes in RTDB (sensors/zone-1..3,
// one per crop) grouped into TWO climate zones on the dashboard:
//   Lowland  = tomato (zone-1) + eggplant (zone-2)  -> readings averaged
//   Highland = bell pepper (zone-3)
// Irrigation is a per-zone VPD-gated soil-moisture state machine (decision log items 1-2).
import { ref, computed, onUnmounted }                          from 'vue'
import { db, isDemoMode }                                      from '@/firebase'
import { validateSensorPayload }                               from '@/security/validator'
import { checkRateLimit, resetRateLimit, formatResetTime }     from '@/security/rateLimiter'

// ── Physical sensor nodes → crop → climate zone ─────────────────────────────
export const CROPS = [
  { nodeId: 'zone-1', crop: 'tomato',      label: 'Tomato',      emoji: '🍅', climate: 'lowland'  },
  { nodeId: 'zone-2', crop: 'eggplant',    label: 'Eggplant',    emoji: '🍆', climate: 'lowland'  },
  { nodeId: 'zone-3', crop: 'bell_pepper', label: 'Bell Pepper', emoji: '🫑', climate: 'highland' },
]

// Irrigation state, per zone, mirrors the ESP32's evaluateZone() decision
// (decision log items 1-2; DOC-CAP §2.3/2.5): a threshold state machine on
// soil moisture (% field capacity), gated by VPD for a Normal start only.
// Defaults MUST match RelayControl.vue's LOWLAND_/HIGHLAND_IRRIGATION_DEFAULTS
// (both read/write config/thresholds and config/thresholds_highland) and, once
// it's updated (decision log flag F2), the firmware constants.
const IRRIGATION_DEFAULTS = {
  lowland:  { smNormal: 70, smEmergency: 60, smStop: 80, vpdGate: 0.6 },
  highland: { smNormal: 75, smEmergency: 70, smStop: 80, vpdGate: 0.6 },
}

export const ZONE_META = [
  {
    id:       'lowland',
    label:    'Lowland Zone',
    subtitle: 'Tomato · Eggplant',
    colorKey: 'lowland',
    thresholds: {
      moisture:    { low: 30, high: 80 },
      temperature: { low: 20, high: 35 },
      humidity:    { low: 40, high: 85 },
      vpd:         { low: 0.4, high: 1.6 },   // kPa
    },
    irrigation: IRRIGATION_DEFAULTS.lowland,
  },
  {
    id:       'highland',
    label:    'Highland Zone',
    subtitle: 'Bell Pepper',
    colorKey: 'highland',
    thresholds: {
      moisture:    { low: 30, high: 80 },
      temperature: { low: 15, high: 28 },
      humidity:    { low: 50, high: 90 },
      vpd:         { low: 0.4, high: 1.2 },   // cooler crop → tighter VPD band
    },
    irrigation: IRRIGATION_DEFAULTS.highland,
  },
]

// ── Pure helpers ────────────────────────────────────────────────────────────
/** Vapor pressure deficit (kPa) from air temp (°C) and RH (%). Magnus-Tetens
 *  equation, per decision log item 41. */
export function computeVpd(tempC, rh) {
  if (typeof tempC !== 'number' || typeof rh !== 'number') return null
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3))
  return +(svp * (1 - rh / 100)).toFixed(2)
}

/**
 * Instantaneous read of the evaluateZone() state machine from the current
 * moisture/VPD snapshot alone (decision log items 1-2):
 *   - moisture >= smStop            -> 'stop'      (a running session would end)
 *   - moisture <= smEmergency       -> 'emergency'  (waters regardless of VPD)
 *   - moisture <= smNormal AND
 *     vpd >= vpdGate                -> 'normal'     (a Normal start would begin)
 *   - otherwise                     -> 'idle'       (no request right now)
 * This does NOT reproduce the firmware's latch: a session that is already
 * running stays open until smStop regardless of VPD, and the dashboard has
 * no visibility into that in-progress state, only the live sensor reading.
 * Treat this as "would the state machine request water right now", not as
 * the true relay state.
 */
export function computeIrrigationState(moisture, vpd, cfg) {
  if (typeof moisture !== 'number') return { state: null, label: 'NO DATA' }
  if (moisture >= cfg.smStop)       return { state: 'stop',      label: 'STOP — soil saturated' }
  if (moisture <= cfg.smEmergency)  return { state: 'emergency', label: 'EMERGENCY — waters regardless of VPD' }
  if (moisture <= cfg.smNormal && typeof vpd === 'number' && vpd >= cfg.vpdGate)
    return { state: 'normal', label: 'NORMAL START' }
  return { state: 'idle', label: 'IDLE — no request' }
}

export function getSensorStatus(value, thresholds) {
  if (value === null || value === undefined) return 'unknown'
  if (value < thresholds.low)  return 'low'
  if (value > thresholds.high) return 'high'
  return 'ok'
}

const emptySensors = () => ({ moisture: null, temperature: null, humidity: null, updatedAt: null })

function avg(values) {
  const v = values.filter(x => typeof x === 'number')
  return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null
}

function buildZone(meta, nodes) {
  const crops = CROPS.filter(c => c.climate === meta.id).map(c => ({ ...c, ...nodes[c.nodeId] }))
  const loading = crops.every(c => c.loading)
  const live    = crops.filter(c => !c.loading && !c.error)

  const sensors = {
    moisture:    avg(live.map(c => c.sensors.moisture)),
    temperature: avg(live.map(c => c.sensors.temperature)),
    humidity:    avg(live.map(c => c.sensors.humidity)),
    updatedAt:   live.length ? Math.max(...live.map(c => c.sensors.updatedAt ?? 0)) : null,
  }
  const vpd = computeVpd(sensors.temperature, sensors.humidity)

  return {
    ...meta,
    crops,
    loading,
    error: !loading && live.length === 0 ? (crops.find(c => c.error)?.error ?? 'No data.') : null,
    sensors,
    vpd,
    irrigationState: computeIrrigationState(sensors.moisture, vpd, meta.irrigation),
    irrigationCfg:   meta.irrigation,
  }
}

// ── Demo data ───────────────────────────────────────────────────────────────
function makeDemoReading(index) {
  const bases = [
    { moisture: 52, temperature: 31.0, humidity: 68 },   // tomato
    { moisture: 47, temperature: 31.5, humidity: 66 },   // eggplant
    { moisture: 58, temperature: 26.0, humidity: 78 },   // bell pepper
  ]
  const b = bases[index]
  const jitter = (range) => (Math.random() - 0.5) * range
  return {
    moisture:    Math.min(100, Math.max(0, +(b.moisture + jitter(8)).toFixed(1))),
    temperature: +(b.temperature + jitter(2)).toFixed(1),
    humidity:    Math.min(100, Math.max(0, +(b.humidity + jitter(10)).toFixed(1))),
    updatedAt:   Date.now(),
  }
}

// ── Composable ──────────────────────────────────────────────────────────────
export function useSensorData() {
  const nodes = ref(Object.fromEntries(
    CROPS.map(c => [c.nodeId, { loading: true, error: null, sensors: emptySensors() }])
  ))
  const unsubscribers = []

  if (isDemoMode) {
    CROPS.forEach((c, i) => {
      const update = () => { nodes.value[c.nodeId] = { loading: false, error: null, sensors: makeDemoReading(i) } }
      update()
      const timer = setInterval(update, 4000 + i * 800)
      unsubscribers.push(() => clearInterval(timer))
    })
  } else {
    import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
      CROPS.forEach((c) => {
        // Rate limit: max 5 connection attempts per node per 15 min
        const rlKey = `firebase-connect-${c.nodeId}`
        const rl    = checkRateLimit(rlKey)
        if (!rl.allowed) {
          nodes.value[c.nodeId] = {
            loading: false, sensors: emptySensors(),
            error: `Too many connection attempts. Retry in ${formatResetTime(rl.resetAt)}.`,
          }
          return
        }

        const sensorRef = dbRef(db, `sensors/${c.nodeId}`)
        const unsubscribe = onValue(
          sensorRef,
          (snapshot) => {
            const result = validateSensorPayload(snapshot.val(), c.nodeId)
            if (!result.ok) {
              nodes.value[c.nodeId] = { loading: false, sensors: emptySensors(), error: result.error }
              return
            }
            resetRateLimit(rlKey)
            nodes.value[c.nodeId] = { loading: false, error: null, sensors: result.data }
          },
          () => {
            // Never surface raw Firebase errors — they can expose project info
            nodes.value[c.nodeId] = {
              loading: false, sensors: emptySensors(), error: 'Unable to reach sensor. Check connection.',
            }
          }
        )
        unsubscribers.push(() => off(sensorRef, 'value', unsubscribe))
      })
    })
  }

  onUnmounted(() => unsubscribers.forEach(fn => fn()))

  const zones = computed(() => ZONE_META.map(meta => buildZone(meta, nodes.value)))
  return { zones, isDemoMode }
}