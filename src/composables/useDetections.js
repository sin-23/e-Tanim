// src/composables/useDetections.js
//
// Harvest maturity results from RTDB `detections/{tomato|eggplant|bell_pepper}`.
// Written by the Mini PC after the orchestrator + evaluator pipeline runs
// (upload on change of ripe count, plus a 30 minute heartbeat); the dashboard
// only reads.
import { ref, computed, onUnmounted } from 'vue'
import { db } from '@/firebase'
import { validateDetectionPayload } from '@/security/validator'
import { CROPS } from '@/composables/useSensorData'

// One entry per crop, reusing labels/emojis from the sensor data model.
export const DETECTION_CROPS = CROPS.map(({ crop, label, emoji, climate }) => ({
  id: crop, label, emoji, climate,
}))

// Heartbeat is 30 min, so no update for 45 min means the pipeline is down
// (Mini PC off, camera fault, or no internet).
export const STALE_AFTER_MS = 45 * 60 * 1000

const blank = () => ({
  underripe: 0, ripe: 0, damaged: 0, confidence: null, updatedAt: null,
  loading: true, error: null,
})

export function useDetections() {
  const state = ref(Object.fromEntries(DETECTION_CROPS.map(c => [c.id, blank()])))
  const now = ref(Date.now())
  const unsubs = []

  const tick = setInterval(() => { now.value = Date.now() }, 30000)

  import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
    DETECTION_CROPS.forEach(({ id }) => {
      const r = dbRef(db, `detections/${id}`)
      const cb = onValue(
        r,
        (snap) => {
          const raw = snap.val()
          if (raw === null) {
            state.value = { ...state.value, [id]: { ...blank(), loading: false, error: 'No detections yet.' } }
            return
          }
          const res = validateDetectionPayload(raw)
          state.value = {
            ...state.value,
            [id]: res.ok
              ? { ...res.data, loading: false, error: null }
              : { ...blank(), loading: false, error: res.error },
          }
        },
        () => {
          state.value = { ...state.value, [id]: { ...blank(), loading: false, error: 'Connection error.' } }
        },
      )
      unsubs.push(() => off(r, 'value', cb))
    })
  })

  onUnmounted(() => {
    clearInterval(tick)
    unsubs.forEach(fn => fn())
  })

  const detections = computed(() =>
    DETECTION_CROPS.map(meta => {
      const s = state.value[meta.id]
      const stale = s.updatedAt !== null && now.value - s.updatedAt > STALE_AFTER_MS
      return { ...meta, ...s, stale }
    })
  )

  // Ripe fruit currently reported across all crops (ignores errored/loading nodes).
  const totalRipe = computed(() =>
    detections.value.reduce((n, d) => n + (d.loading || d.error ? 0 : d.ripe), 0)
  )

  return { detections, totalRipe }
}