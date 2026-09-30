// src/composables/useReservoirs.js
//
// Live reservoir levels from RTDB `reservoirs/{water|fertilizer}`.
// Written by the ESP32 (level sensors, 5 s read, upload on change + 60 s
// heartbeat); the dashboard only reads.
import { ref, computed, onUnmounted } from 'vue'
import { db } from '@/firebase'
import { validateReservoirPayload, RESERVOIR_LOW_PCT } from '@/security/validator'
import { logActivity } from '@/composables/useActivityLog'

// RESERVOIR_LOW_PCT (30) is the default alert level. The user can change it per
// reservoir on the Reservoir page; it is stored at RTDB config/reservoir_low
// as { water: <pct>, fertilizer: <pct> } with a sibling change marker
// config/reservoir_low_updated (epoch seconds) for the ESP32 to poll.
export { RESERVOIR_LOW_PCT }
export const RESERVOIR_LOW_MIN = 5
export const RESERVOIR_LOW_MAX = 95

export const RESERVOIRS = [
  { id: 'water',      label: 'Water Reservoir',      subtitle: 'Irrigation & misting', emoji: '💧' },
  { id: 'fertilizer', label: 'Fertilizer Reservoir', subtitle: 'Liquid fertilizer',    emoji: '🧪' },
]

const blank = () => ({ levelPct: null, low: false, updatedAt: null, loading: true, error: null })

export function useReservoirs() {
  const state = ref({ water: blank(), fertilizer: blank() })
  const lowPct = ref({ water: RESERVOIR_LOW_PCT, fertilizer: RESERVOIR_LOW_PCT })
  const unsubs = []

  import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
    // User-adjustable low-level alert thresholds (fall back to 30% when unset/invalid).
    const tRef = dbRef(db, 'config/reservoir_low')
    const tCb = onValue(tRef, (snap) => {
      const raw = snap.val() ?? {}
      const pick = (v) => (typeof v === 'number' && isFinite(v) && v >= RESERVOIR_LOW_MIN && v <= RESERVOIR_LOW_MAX)
        ? v : RESERVOIR_LOW_PCT
      lowPct.value = { water: pick(raw.water), fertilizer: pick(raw.fertilizer) }
    }, () => {})
    unsubs.push(() => off(tRef, 'value', tCb))

    RESERVOIRS.forEach(({ id }) => {
      const r = dbRef(db, `reservoirs/${id}`)
      const cb = onValue(
        r,
        (snap) => {
          const raw = snap.val()
          if (raw === null) {
            state.value = { ...state.value, [id]: { ...blank(), loading: false, error: 'No data yet.' } }
            return
          }
          const res = validateReservoirPayload(raw)
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
    unsubs.forEach(fn => fn())
  })

  // `low` is recomputed here against the user's threshold whenever a level is
  // known, so changing the setting takes effect on the dashboard immediately
  // and a stale ESP32 flag (written against the old threshold) can't mislead.
  const reservoirs = computed(() =>
    RESERVOIRS.map(meta => {
      const r = state.value[meta.id]
      const pct = lowPct.value[meta.id]
      const low = r.levelPct !== null ? r.levelPct <= pct : r.low
      return { ...meta, ...r, low, lowPct: pct }
    })
  )

  const lowReservoirs = computed(() =>
    reservoirs.value.filter(r => r.low && !r.loading && !r.error)
  )

  /** Save a new low-level alert threshold (percent) for one reservoir. */
  async function saveLowThreshold(id, pct) {
    const n = Math.round(Number(pct))
    if (!RESERVOIRS.some(r => r.id === id) || !isFinite(n) || n < RESERVOIR_LOW_MIN || n > RESERVOIR_LOW_MAX) {
      throw new Error(`Enter a whole number from ${RESERVOIR_LOW_MIN} to ${RESERVOIR_LOW_MAX}.`)
    }
    const { ref: dbRef, update } = await import('firebase/database')
    await update(dbRef(db), {
      [`config/reservoir_low/${id}`]: n,
      'config/reservoir_low_updated': Math.floor(Date.now() / 1000),
    })
    const label = RESERVOIRS.find(r => r.id === id).label
    logActivity(`${label} low-level alert threshold set to ${n}%`, '#3b9dd2', 'threshold', { category: 'reservoir' })
  }

  return { reservoirs, lowReservoirs, saveLowThreshold }
}