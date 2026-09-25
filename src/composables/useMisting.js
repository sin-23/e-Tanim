// src/composables/useMisting.js
//
// Read-only status for the highland misting circuit.
//   control/relay_mist (+ _off_at)  manual override flag written by the dashboard
//   config/misting                  { tempOn (C), humidityOn (%) } user thresholds
//   sensors/zone-3                  highland (bell pepper) DHT22 reading
//
// The paper's schema has no node where the ESP32 reports the *actual* misting
// relay state, so "manual" is a confirmed command flag, while "triggered" is the
// dashboard's estimate of what the ESP32 auto rule will do. Per the decision log
// (item 3, RESOLVED) and DOC-CAP-FINAL 2.3's pseudocode, the auto trigger fires
// when highland temperature is at or above tempOn OR humidity is at or below
// humidityOn (an earlier Group5 flowchart wording used AND with high humidity;
// that wording is superseded).
import { ref, computed, onUnmounted } from 'vue'
import { db } from '@/firebase'
import { validateSensorPayload } from '@/security/validator'

// PROVISIONAL. Keep in sync with RelayControl.vue (pump 4) and the firmware.
export const MISTING_DEFAULTS = { tempOn: 32, humidityOn: 70 }

// DHT22 uploads every 10 s; no reading for 60 s means the highland node is down.
export const SENSOR_STALE_MS = 60 * 1000

const TEMP_RANGE = [-40, 85]   // paper: config/misting.tempOn
const HUM_RANGE  = [0, 100]    // paper: config/misting.humidityOn

const inRange = (v, [lo, hi]) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi

export function useMisting() {
  const manualOn   = ref(false)
  const offAt      = ref(null)
  const config     = ref({ ...MISTING_DEFAULTS })
  const configFrom = ref('default')            // 'default' | 'database'
  const sensors    = ref(null)                 // { temperature, humidity, updatedAt } | null
  const sensorErr  = ref(null)
  const loading    = ref(true)
  const now        = ref(Date.now())
  const unsubs     = []

  const tick = setInterval(() => { now.value = Date.now() }, 1000)

  import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
    const watch = (path, handler) => {
      const r = dbRef(db, path)
      const cb = onValue(r, handler, () => {})
      unsubs.push(() => off(r, 'value', cb))
    }

    watch('control/relay_mist', (s) => { manualOn.value = s.val() === true; loading.value = false })
    watch('control/relay_mist_off_at', (s) => {
      const v = s.val()
      offAt.value = typeof v === 'number' && v > 0 ? v : null
    })

    watch('config/misting', (s) => {
      const raw = s.val()
      if (raw && inRange(raw.tempOn, TEMP_RANGE) && inRange(raw.humidityOn, HUM_RANGE)) {
        config.value = { tempOn: raw.tempOn, humidityOn: raw.humidityOn }
        configFrom.value = 'database'
      } else {
        config.value = { ...MISTING_DEFAULTS }
        configFrom.value = 'default'
      }
    })

    watch('sensors/zone-3', (s) => {
      const res = validateSensorPayload(s.val(), 'zone-3')
      if (res.ok) { sensors.value = res.data; sensorErr.value = null }
      else        { sensors.value = null;     sensorErr.value = res.error }
    })
  })

  onUnmounted(() => {
    clearInterval(tick)
    unsubs.forEach(fn => fn())
  })

  const sensorStale = computed(() =>
    !sensors.value || sensors.value.updatedAt === null ||
    now.value - sensors.value.updatedAt > SENSOR_STALE_MS
  )

  const tempMet = computed(() =>
    !sensorStale.value && typeof sensors.value.temperature === 'number' &&
    sensors.value.temperature >= config.value.tempOn
  )
  const humidityMet = computed(() =>
    !sensorStale.value && typeof sensors.value.humidity === 'number' &&
    sensors.value.humidity <= config.value.humidityOn
  )

  // Seconds left on a timed manual run (null when untimed).
  const manualRemainingS = computed(() =>
    manualOn.value && offAt.value ? Math.max(0, Math.ceil((offAt.value - now.value) / 1000)) : null
  )

  return {
    loading, manualOn, manualRemainingS,
    config, configFrom,
    sensors, sensorErr, sensorStale,
    tempMet, humidityMet,
    // OR per the decision log / 2.3 pseudocode: either condition alone triggers misting.
    autoConditionsMet: computed(() => tempMet.value || humidityMet.value),
  }
}