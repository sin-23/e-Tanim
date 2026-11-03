// src/composables/useDetections.js
//
// Fruit-level detections from RTDB `detections/{crop}/{fruitId}`, written by the
// Mini PC AI Inference on events only, plus its heartbeat `status/miniPc/lastCycleAt`.
// Counts are one per fruit by its current stage. A fruit stops counting when it is
// marked harvested or has not been seen for 48 hours (decision log item 44).
// The user may mark a fruit harvested and undo it; nothing else is written here.
import { ref, computed, onUnmounted } from 'vue'
import { db } from '@/firebase'
import { validateCropFruits } from '@/security/validator'
import { CROPS } from '@/composables/useSensorData'
import { sysPath } from '@/composables/useSystemId'

export const DETECTION_CROPS = CROPS.map(({ crop, label, emoji, climate }) => ({
  id: crop, label, emoji, climate,
}))

// Provisional values (checklist 13.8)
export const PRESUMED_HARVESTED_MS = 48 * 60 * 60 * 1000
const HEARTBEAT_STALE_MS    = 60 * 60 * 1000

export const FRUIT_STATUS = {
  active:    'Active',
  harvested: 'Harvested by user',
  presumed:  'Presumed harvested',
}

// Badge tones, shared by the Crop Monitor list and the fruit detail
export const STAGE_TONE  = { underripe: 'neutral', ripe: 'good', damaged: 'danger' }
export const STATUS_TONE = {
  [FRUIT_STATUS.active]:    'good',
  [FRUIT_STATUS.harvested]: 'neutral',
  [FRUIT_STATUS.presumed]:  'warn',
}

const blankCrop = () => ({ fruits: [], loading: true, error: null })

export function useDetections() {
  const crops = ref(Object.fromEntries(DETECTION_CROPS.map(c => [c.id, blankCrop()])))
  const lastCycleAt = ref(null)
  const heartbeatLoaded = ref(false)
  const now = ref(Date.now())
  const unsubs = []

  const tick = setInterval(() => { now.value = Date.now() }, 30000)

  import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
    DETECTION_CROPS.forEach(({ id }) => {
      const r = dbRef(db, sysPath(`detections/${id}`))
      const cb = onValue(
        r,
        (snap) => {
          const raw = snap.val()
          if (raw === null) {
            crops.value = { ...crops.value, [id]: { fruits: [], loading: false, error: null } }
            return
          }
          const { fruits, skipped } = validateCropFruits(raw)
          crops.value = {
            ...crops.value,
            [id]: {
              fruits,
              loading: false,
              error: fruits.length === 0 && skipped > 0 ? 'Fruit records could not be read.' : null,
            },
          }
        },
        () => {
          crops.value = { ...crops.value, [id]: { fruits: [], loading: false, error: 'Connection error.' } }
        },
      )
      unsubs.push(() => off(r, 'value', cb))
    })

    const hb = dbRef(db, sysPath('status/miniPc/lastCycleAt'))
    const hbCb = onValue(
      hb,
      (snap) => {
        const v = snap.val()
        lastCycleAt.value = typeof v === 'number' && v > 0 ? v : null
        heartbeatLoaded.value = true
      },
      () => { heartbeatLoaded.value = true },
    )
    unsubs.push(() => off(hb, 'value', hbCb))
  })

  onUnmounted(() => {
    clearInterval(tick)
    unsubs.forEach(fn => fn())
  })

  // Mini PC AI Inference is down after 1 hour without a heartbeat.
  const miniPc = computed(() => ({
    loaded: heartbeatLoaded.value,
    lastCycleAt: lastCycleAt.value,
    online: lastCycleAt.value !== null && now.value - lastCycleAt.value <= HEARTBEAT_STALE_MS,
  }))

  function statusOf(f) {
    if (f.harvested) return FRUIT_STATUS.harvested
    if (now.value - f.updatedAt > PRESUMED_HARVESTED_MS) return FRUIT_STATUS.presumed
    return FRUIT_STATUS.active
  }

  // Every fruit, flat, for the Crop Monitor list.
  const fruitRows = computed(() =>
    DETECTION_CROPS.flatMap(meta =>
      crops.value[meta.id].fruits.map(f => ({
        ...f, cropId: meta.id, crop: meta.label, status: statusOf(f),
      }))
    )
  )

  // One card per crop. Only active fruit counts.
  const detections = computed(() =>
    DETECTION_CROPS.map(meta => {
      const c = crops.value[meta.id]
      const active = c.fruits.filter(f => statusOf(f) === FRUIT_STATUS.active)
      const countOf = (stage) => active.filter(f => f.stage === stage).length
      const latest = c.fruits.reduce((m, f) => Math.max(m, f.updatedAt), 0)
      return {
        ...meta,
        loading: c.loading,
        error: c.error,
        underripe: countOf('underripe'),
        ripe: countOf('ripe'),
        damaged: countOf('damaged'),
        updatedAt: latest || null,
        stale: heartbeatLoaded.value && !miniPc.value.online,
        fruits: active
          .map(f => ({ id: f.id, stage: f.stage, confidence: f.confidence }))
          .sort((a, b) => a.id.localeCompare(b.id)),
      }
    })
  )

  const totalRipe = computed(() =>
    detections.value.reduce((n, d) => n + (d.loading || d.error ? 0 : d.ripe), 0)
  )

  // Marking harvested or undoing it writes only these two fields.
  async function setHarvested(cropId, fruitId, harvested) {
    const { ref: dbRef, update } = await import('firebase/database')
    try {
      await update(dbRef(db, sysPath(`detections/${cropId}/${fruitId}`)), {
        harvested: harvested ? true : null,
        harvestedAt: harvested ? Date.now() : null,
      })
      return true
    } catch (err) {
      console.error('Could not update the fruit record:', err)
      return false
    }
  }

  return { detections, fruitRows, miniPc, totalRipe, setHarvested }
}