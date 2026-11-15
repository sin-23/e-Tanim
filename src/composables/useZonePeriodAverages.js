// src/composables/useZonePeriodAverages.js
//
// Reads the stored zone period averages (Firestore systems/{systemId}/zone_period_averages)
// ONCE per call, not with a live listener: the data changes six times a day, and one read
// per document keeps the Reports page far under the free daily read limit (checklist 8.4).
// Also reads the saved irrigation thresholds so the charts can draw reference lines.
import { ref } from 'vue'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { ref as dbRef, get } from 'firebase/database'
import { firestore, db } from '@/firebase'
import { systemId, sysPath } from '@/composables/useSystemId'
import { validateAveragePayload, AVERAGE_PERIODS } from '@/security/validator'
import { ZONE_META } from '@/composables/useSensorData'

// About 6 documents a day, so this covers roughly 11 months. Provisional.
const MAX_DOCS = 2000
export const VPD_GATE_FALLBACK = 0.6   // kPa, paper

const METRICS = ['soilMoisture', 'temperature', 'humidity', 'vpd']

/** Sample-weighted daily summary of the periods that exist for one zone and date. */
function rollUp(periods) {
  const have = AVERAGE_PERIODS.map(p => periods[p]).filter(Boolean)
  if (!have.length) return null
  const total = have.reduce((n, d) => n + d.sampleCount, 0)
  const out = { sampleCount: total, minimum: {}, maximum: {}, periodsCount: have.length }
  for (const m of METRICS) {
    out[m] = have.reduce((sum, d) => sum + d[m] * d.sampleCount, 0) / total
    const los = have.map(d => d.minimum[m]).filter(v => v !== null)
    const his = have.map(d => d.maximum[m]).filter(v => v !== null)
    out.minimum[m] = los.length ? Math.min(...los) : null
    out.maximum[m] = his.length ? Math.max(...his) : null
  }
  return out
}

export function useZonePeriodAverages() {
  const rows = ref([])          // [{ date, lowland: { daily, morning, afternoon, night }, highland: {...} }], newest first
  const state = ref('loading')  // 'loading' | 'ready' | 'empty' | 'error'
  const skipped = ref(0)        // documents ignored because they failed validation
  const truncated = ref(false)  // true when the document limit was reached
  const thresholds = ref({
    lowland:  { ...ZONE_META[0].irrigation },
    highland: { ...ZONE_META[1].irrigation },
  })

  /** range: { from, to } as 'YYYY-MM-DD' in garden time, or null for no limit. */
  async function load(range = {}) {
    state.value = 'loading'
    try {
      if (!systemId.value) throw new Error('Not joined to a unit yet.')
      const parts = [collection(firestore, 'systems', systemId.value, 'zone_period_averages')]
      const clauses = []
      if (range.from) clauses.push(where('date', '>=', range.from))
      if (range.to)   clauses.push(where('date', '<=', range.to))
      // One field for the range and the sort, so no composite index is needed.
      const snap = await getDocs(query(parts[0], ...clauses, orderBy('date', 'desc'), limit(MAX_DOCS)))
      truncated.value = snap.size >= MAX_DOCS

      const byDate = new Map()
      let bad = 0
      for (const d of snap.docs) {
        const v = validateAveragePayload(d.data())
        if (!v.ok) { bad++; continue }
        const a = v.data
        if (!byDate.has(a.date)) byDate.set(a.date, { date: a.date, lowland: {}, highland: {} })
        byDate.get(a.date)[a.zone][a.period] = a
      }
      skipped.value = bad

      rows.value = [...byDate.values()]
        .sort((x, y) => (x.date < y.date ? 1 : -1))
        .map(r => {
          r.lowland.daily  = rollUp(r.lowland)
          r.highland.daily = rollUp(r.highland)
          return r
        })
      state.value = rows.value.length ? 'ready' : 'empty'
    } catch (err) {
      console.error('Failed to load zone period averages:', err)
      rows.value = []
      state.value = 'error'
    }
  }

  /** Saved thresholds for the reference lines. Falls back to the defaults. */
  async function loadThresholds() {
    const paths = { lowland: 'config/thresholds', highland: 'config/thresholds_highland' }
    for (const [zone, rel] of Object.entries(paths)) {
      try {
        const snap = await get(dbRef(db, sysPath(rel)))
        const v = snap.val()
        if (v && typeof v === 'object') {
          const next = { ...thresholds.value[zone] }
          for (const k of ['smNormal', 'smEmergency', 'smStop', 'vpdGate']) {
            if (typeof v[k] === 'number' && isFinite(v[k])) next[k] = v[k]
          }
          thresholds.value = { ...thresholds.value, [zone]: next }
        }
      } catch (err) {
        console.error(`Could not read ${rel}; using defaults.`, err)
      }
    }
  }

  return { rows, state, skipped, truncated, thresholds, load, loadThresholds }
}