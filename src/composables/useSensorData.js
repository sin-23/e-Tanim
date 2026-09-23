// src/composables/useSensorData.js
//
// e-Tanim data model: THREE physical sensor nodes in RTDB (sensors/zone-1..3,
// one per crop) grouped into TWO climate zones on the dashboard:
//   Lowland  = tomato (zone-1) + eggplant (zone-2)  -> readings averaged
//   Highland = bell pepper (zone-3)
// Irrigation is scored per climate zone from soil moisture + VPD.
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

// PROVISIONAL display values. The ESP32 firmware decides irrigation; keep the
// weights/cut-offs below in sync with its constants so the dashboard estimate
// matches what the hardware actually does.
const SCORE_DEFAULTS = {
  weights:     { moisture: 0.6, vpd: 0.4 },
  moistureDry: 30,   // % soil moisture treated as fully dry  (dryness = 1)
  moistureWet: 60,   // % soil moisture treated as fully wet  (dryness = 0)
  triggerAt:   50,   // score (0-100) at or above which irrigation is requested
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
    score: { ...SCORE_DEFAULTS, vpdLow: 0.8, vpdHigh: 1.6 },
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
    score: { ...SCORE_DEFAULTS, vpdLow: 0.6, vpdHigh: 1.2 },
  },
]

// ── Pure helpers ────────────────────────────────────────────────────────────
const clamp01 = (x) => Math.max(0, Math.min(1, x))

/** Vapor pressure deficit (kPa) from air temp (°C) and RH (%). Tetens equation. */
export function computeVpd(tempC, rh) {
  if (typeof tempC !== 'number' || typeof rh !== 'number') return null
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3))
  return +(svp * (1 - rh / 100)).toFixed(2)
}

/** Weighted irrigation trigger score, 0-100 (higher = needs water more). */
export function computeIrrigationScore(moisture, vpd, cfg) {
  if (typeof moisture !== 'number' || typeof vpd !== 'number') return null
  const dryness = clamp01((cfg.moistureWet - moisture) / (cfg.moistureWet - cfg.moistureDry))
  const stress  = clamp01((vpd - cfg.vpdLow) / (cfg.vpdHigh - cfg.vpdLow))
  return Math.round((cfg.weights.moisture * dryness + cfg.weights.vpd * stress) * 100)
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
    score: computeIrrigationScore(sensors.moisture, vpd, meta.score),
    score_cfg: meta.score,
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