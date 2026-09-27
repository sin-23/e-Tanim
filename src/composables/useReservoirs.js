// src/composables/useReservoirs.js
//
// Live reservoir levels from RTDB `reservoirs/{water|fertilizer}`.
// Written by the ESP32 (level sensors, 5 s read, upload on change + 60 s
// heartbeat); the dashboard only reads.
import { ref, computed, onUnmounted } from 'vue'
import { db } from '@/firebase'
import { validateReservoirPayload, RESERVOIR_LOW_PCT } from '@/security/validator'

export { RESERVOIR_LOW_PCT }

export const RESERVOIRS = [
  { id: 'water',      label: 'Water Reservoir',      subtitle: 'Irrigation & misting', emoji: '💧' },
  { id: 'fertilizer', label: 'Fertilizer Reservoir', subtitle: 'Liquid fertilizer',    emoji: '🌿' },
]

const blank = () => ({ levelPct: null, low: false, updatedAt: null, loading: true, error: null })

export function useReservoirs() {
  const state = ref({ water: blank(), fertilizer: blank() })
  const unsubs = []

  import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
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

  const reservoirs = computed(() =>
    RESERVOIRS.map(meta => ({ ...meta, ...state.value[meta.id] }))
  )

  const lowReservoirs = computed(() =>
    reservoirs.value.filter(r => r.low && !r.loading && !r.error)
  )

  return { reservoirs, lowReservoirs }
}