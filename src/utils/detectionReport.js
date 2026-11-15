// src/utils/detectionReport.js
//
// Counts for the Reports > Detections tab, computed in the browser from the fruit records
// (decision log item 47: no daily summary node). Pure functions, no Firebase.
//
//   seen       one event per fruit, on the garden date it was first seen, by its current stage
//   harvested  one event per fruit that left the plant: the day the user marked it, or for a
//              fruit presumed harvested, the day it was last seen
//   seen events also carry `endDate`, the harvest day (null while the fruit is still on the plant),
//              and `history` (date and stage of each entry), so the dashboard can count fruit on the
//              plant on any given day, by the stage it had that day
//   ready      one event per ripe entry: the first ripe entry of a fruit is "Ripe detected",
//              later ripe entries are "Ripe reminder"
// Dates are 'YYYY-MM-DD' in garden time (UTC+8).

export const STAGES = ['underripe', 'ripe', 'damaged']
const TZ = 'Asia/Manila'
const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ })

export const gardenDate = (ms) => dateFmt.format(new Date(ms))
const parse = (s) => Date.parse(`${s}T00:00:00Z`)
const addDays = (s, n) => new Date(parse(s) + n * 86400000).toISOString().slice(0, 10)

export const inRange = (date, from, to) => (!from || date >= from) && (!to || date <= to)

/** Every date from `from` to `to`, oldest first. Capped so a bad range cannot hang the page. */
export function dayList(from, to, cap = 731) {
  const out = []
  for (let d = from; d <= to && out.length < cap; d = addDays(d, 1)) out.push(d)
  return out
}

/**
 * @param fruits  [{ id, cropId, crop, stage, firstSeen, updatedAt, harvested, harvestedAt, entries }]
 * @param nowMs   current time
 * @param presumedMs  unseen limit after which a fruit is presumed harvested
 */
export function buildEvents(fruits, nowMs, presumedMs) {
  const seen = [], harvested = [], ready = []
  for (const f of fruits) {
    let endDate = null
    if (f.harvested && f.harvestedAt) {
      endDate = gardenDate(f.harvestedAt)
      harvested.push({ date: endDate, cropId: f.cropId, by: 'user' })
    } else if (!f.harvested && nowMs - f.updatedAt > presumedMs) {
      endDate = gardenDate(f.updatedAt)          // presumed harvested: the day it was last seen
      harvested.push({ date: endDate, cropId: f.cropId, by: 'presumed' })
    }
    // `history` lets the dashboard tell which stage a fruit was in on a given day.
    const history = f.entries.map(e => ({ date: gardenDate(e.timestamp), stage: e.stage }))
    seen.push({ date: gardenDate(f.firstSeen), cropId: f.cropId, stage: f.stage, endDate, history })

    let first = true
    for (const e of f.entries) {            // entries arrive oldest first
      if (e.stage !== 'ripe') continue
      ready.push({
        ts: e.timestamp, date: gardenDate(e.timestamp), cropId: f.cropId, crop: f.crop, fruitId: f.id,
        kind: first ? 'Ripe detected' : 'Ripe reminder',
      })
      first = false
    }
  }
  return { seen, harvested, ready }
}

/** One row per day: counts by stage for the chosen crop (null = all crops). */
export function dailyRows(seen, days, cropId) {
  const rows = new Map(days.map(d => [d, { date: d, underripe: 0, ripe: 0, damaged: 0, total: 0 }]))
  for (const e of seen) {
    if (cropId && e.cropId !== cropId) continue
    const r = rows.get(e.date)
    if (!r) continue
    r[e.stage]++
    r.total++
  }
  return [...rows.values()]
}

/** Fruit on the plant on each day, split by the stage it had that day: first seen on or before the
 *  day and not past its harvest day. The stage on a day is the latest entry on or before it (before
 *  the first entry, the first entry's stage). Returns { underripe: [n per day], ripe: [...], damaged: [...] }. */
export function onPlantByStage(seen, days, cropId) {
  const out = Object.fromEntries(STAGES.map(s => [s, days.map(() => 0)]))
  for (const e of seen) {
    if (cropId && e.cropId !== cropId) continue
    days.forEach((d, i) => {
      if (e.date > d || (e.endDate !== null && d > e.endDate)) return
      let stage = e.stage
      if (e.history.length) {
        stage = e.history[0].stage
        for (const h of e.history) { if (h.date <= d) stage = h.stage; else break }
      }
      if (out[stage]) out[stage][i]++
    })
  }
  return out
}

/** One row per month ('YYYY-MM'), newest first: first-seen per crop, the total, and harvested.
 *  Only the crops in cropIds are counted. */
export function monthlyRows(events, cropIds, from, to) {
  const months = new Map()
  const wanted = new Set(cropIds)
  const row = (m) => {
    if (!months.has(m)) months.set(m, { month: m, ...Object.fromEntries(cropIds.map(c => [c, 0])), total: 0, harvested: 0 })
    return months.get(m)
  }
  for (const e of events.seen) {
    if (!wanted.has(e.cropId) || !inRange(e.date, from, to)) continue
    const r = row(e.date.slice(0, 7)); r[e.cropId]++; r.total++
  }
  for (const e of events.harvested) {
    if (!wanted.has(e.cropId) || !inRange(e.date, from, to)) continue
    row(e.date.slice(0, 7)).harvested++
  }
  return [...months.values()].sort((a, b) => (a.month < b.month ? 1 : -1))
}