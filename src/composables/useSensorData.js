// src/composables/useSensorData.js
import { ref, onUnmounted }                                from 'vue'
import { db, isDemoMode }                                  from '@/firebase'
import { validateSensorPayload }                           from '@/security/validator'
import { checkRateLimit, resetRateLimit, formatResetTime } from '@/security/rateLimiter'

export const ZONE_META = [
  {
    id:        'zone-1',
    label:     'Zone 1',
    plant:     'Tomato',
    emoji:     '🍅',
    colorKey:  'tomato',
    thresholds: {
      moisture:    { low: 30, high: 80 },
      temperature: { low: 18, high: 35 },
      humidity:    { low: 40, high: 85 },
    },
  },
  {
    id:        'zone-2',
    label:     'Zone 2',
    plant:     'Okra',
    emoji:     '🌿',
    colorKey:  'okra',
    thresholds: {
      moisture:    { low: 25, high: 75 },
      temperature: { low: 20, high: 38 },
      humidity:    { low: 35, high: 80 },
    },
  },
  {
    id:        'zone-3',
    label:     'Zone 3',
    plant:     'Eggplant',
    emoji:     '🍆',
    colorKey:  'eggplant',
    thresholds: {
      moisture:    { low: 35, high: 75 },
      temperature: { low: 18, high: 33 },
      humidity:    { low: 45, high: 85 },
    },
  },
]

function makeDemoReading(index) {
  const bases = [
    { moisture: 62, temperature: 29.5, humidity: 71 },
    { moisture: 45, temperature: 31.2, humidity: 65 },
    { moisture: 58, temperature: 28.0, humidity: 78 },
  ]
  const b = bases[index]
  const jitter = (range) => (Math.random() - 0.5) * range
  return {
    moisture:    Math.min(100, Math.max(0, +(b.moisture    + jitter(8)).toFixed(1))),
    temperature: +(b.temperature + jitter(2)).toFixed(1),
    humidity:    Math.min(100, Math.max(0, +(b.humidity    + jitter(10)).toFixed(1))),
    updatedAt:   Date.now(),
  }
}

export function getSensorStatus(value, thresholds) {
  if (value === null || value === undefined) return 'unknown'
  if (value < thresholds.low)  return 'low'
  if (value > thresholds.high) return 'high'
  return 'ok'
}

export function useSensorData() {
  const zones = ref(
    ZONE_META.map((meta) => ({
      ...meta,
      loading: true,
      error:   null,
      sensors: { moisture: null, temperature: null, humidity: null, updatedAt: null },
    }))
  )

  const unsubscribers = []

  if (isDemoMode) {
    zones.value.forEach((zone, i) => {
      const update = () => {
        zone.loading = false
        zone.sensors = makeDemoReading(i)
      }
      update()
      const timer = setInterval(update, 4000 + i * 800)
      unsubscribers.push(() => clearInterval(timer))
    })
  } else {
    import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
      zones.value.forEach((zone, i) => {

        // ── Rate limit: max 5 connection attempts per zone per 15 min ──
        const rlKey = `firebase-connect-${zone.id}`
        const rl    = checkRateLimit(rlKey)

        if (!rl.allowed) {
          zones.value[i].loading = false
          zones.value[i].error   = `Too many connection attempts. Retry in ${formatResetTime(rl.resetAt)}.`
          return
        }

        const sensorRef = dbRef(db, `sensors/${zone.id}`)

        const unsubscribe = onValue(
          sensorRef,
          (snapshot) => {
            // ── Validate + sanitize incoming payload ─────────────────
            const result = validateSensorPayload(snapshot.val(), zone.id)

            if (!result.ok) {
              zones.value[i].loading = false
              zones.value[i].error   = result.error
              return
            }

            resetRateLimit(rlKey)  // successful read resets the counter

            zones.value[i].loading = false
            zones.value[i].error   = null
            zones.value[i].sensors = result.data
          },
          () => {
            // Never surface raw Firebase errors — they can expose project info
            zones.value[i].loading = false
            zones.value[i].error   = 'Unable to reach sensor. Check connection.'
          }
        )

        unsubscribers.push(() => off(sensorRef, 'value', unsubscribe))
      })
    })
  }

  onUnmounted(() => unsubscribers.forEach(fn => fn()))

  return { zones, isDemoMode }
}
