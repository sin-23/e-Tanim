// src/utils/reportCsv.js
//
// CSV export for the Reports page (Phase 5c). Pure builders plus one download helper.
// Decisions: checklist section 11 (Phase 5c answers). Files are UTF-8 with a byte-order mark so
// Excel shows the degree sign; times come as ISO text in garden time (+08:00) and as epoch ms.
import { dailyRows, onPlantByStage, monthlyRows, inRange, gardenDate, STAGES } from '@/utils/detectionReport'

const GARDEN_OFFSET_MS = 8 * 60 * 60 * 1000   // Asia/Manila has no daylight saving time

/** Epoch ms -> '2026-11-15T09:41:00+08:00' (garden time). */
export const isoGarden = (ms) =>
  (ms === null || ms === undefined) ? '' : new Date(ms + GARDEN_OFFSET_MS).toISOString().slice(0, 19) + '+08:00'

function cell(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** headers: string[]; rows: array of arrays. CRLF line ends, as Excel expects. */
export const rowsToCsv = (all) => all.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n'
export const toCsv = (headers, rows) => rowsToCsv([headers, ...rows])

/** Name: etanim_{systemId}_{from}_{to}_{name}.{ext} */
export const exportName = (systemId, from, to, name, ext = 'csv') => `etanim_${systemId}_${from}_${to}_${name}.${ext}`

/** Starts one download per file, spaced out so browsers are less likely to block them. */
export async function downloadFiles(files) {
  for (let i = 0; i < files.length; i++) {
    const { name, text, blob: ready, type = 'text/csv' } = files[i]
    // Text files get a byte-order mark first so Excel reads them as UTF-8; a ready blob (xlsx) is used as is.
    const blob = ready ?? new Blob(['\uFEFF', text], { type: `${type};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = name
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
    if (i < files.length - 1) await new Promise(r => setTimeout(r, 350))
  }
}

export function notesLines({ tab, systemId, from, to, rangeLabel, tempUnit, extra = [] }) {
  return [
    `e-Tanim export: ${tab}`,
    `System: ${systemId}`,
    `Date range: ${from} to ${to}${rangeLabel ? ` (${rangeLabel})` : ''}`,
    'Time zone: garden time, Asia/Manila (UTC+8). Dates, periods and day groups use it.',
    'Time columns: an ISO text column in garden time (with the +08:00 offset) and an epoch milliseconds column.',
    tempUnit ? `Temperature unit: °${tempUnit} (the Settings unit when the file was made; stored data is in °C).` : null,
    ...extra,
    `Exported: ${isoGarden(Date.now())}`,
    'Files are UTF-8 with a byte-order mark. Open in Excel, or import as UTF-8.',
  ].filter(Boolean)
}
export const notesText = (o) => notesLines(o).join('\r\n') + '\r\n'

// ── Sensor Averages ─────────────────────────────────────────────────────────
const PERIODS = ['daily', 'morning', 'afternoon', 'night']
const ZONES = ['lowland', 'highland']

/** rows: output of useZonePeriodAverages (one per date, newest first). toTemp: Celsius -> display unit. */
export function averagesTables(rows, toTemp, unit) {
  const m = [['Soil moisture', '%', 'soilMoisture'], ['Temperature', `°${unit}`, 'temperature'],
             ['Humidity', '%', 'humidity'], ['VPD', 'kPa', 'vpd']]
  const headers = ['Date (garden time)', 'Zone', 'Period',
    ...m.map(([t, u]) => `${t} (${u})`),
    ...m.flatMap(([t, u]) => [`${t} minimum (${u})`, `${t} maximum (${u})`]),
    'Samples']
  const conv = (key, v) => (v === null || v === undefined) ? null : key === 'temperature' ? toTemp(v) : round(v)
  const out = []
  for (const r of [...rows].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    for (const z of ZONES) for (const p of PERIODS) {
      const a = r[z][p]
      if (!a) continue
      out.push([r.date, z, p,
        ...m.map(([, , k]) => conv(k, a[k])),
        ...m.flatMap(([, , k]) => [conv(k, a.minimum[k]), conv(k, a.maximum[k])]),
        a.sampleCount])
    }
  }
  // The second table is for Excel only: the daily rows on their own, one sheet.
  return [
    { key: 'averages', title: 'All periods', headers, rows: out },
    { key: 'daily', title: 'Daily', headers, rows: out.filter(r => r[2] === 'daily'), xlsxOnly: true },
  ]
}
const round = (v) => +v.toFixed(3)

// ── Detections ──────────────────────────────────────────────────────────────
function entryLabel(f, i) {   // same wording rule as the fruit list
  if (i === 0) return 'First sighting'
  return f.entries[i].stage !== f.entries[i - 1].stage ? 'Stage change' : 'Ripe reminder'
}

/**
 * Six tables, every one following the date range only (not the crop selector).
 * ctx: { fruits, events, crops: [{id,label}], days, from, to }  from/to may be null (All).
 */
export function detectionTables({ fruits, events, crops, days, from, to }) {
  const inFruit = fruits.filter(f => inRange(gardenDate(f.firstSeen), from, to))
    .sort((a, b) => a.firstSeen - b.firstSeen)
  const byDate = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)

  const fruit = {
    key: 'fruit', title: 'Fruit',
    headers: ['Fruit ID', 'Crop', 'Stage', 'Confidence (%)', 'First seen (garden time)', 'First seen (epoch ms)',
      'Last seen (garden time)', 'Last seen (epoch ms)', 'Status', 'Harvested at (garden time)', 'Harvested at (epoch ms)', 'Events'],
    rows: inFruit.map(f => [f.id, f.crop, f.stage, Math.round(f.confidence * 100), isoGarden(f.firstSeen), f.firstSeen,
      isoGarden(f.updatedAt), f.updatedAt, f.status, isoGarden(f.harvestedAt), f.harvestedAt ?? '', f.entries.length]),
  }
  const entries = {
    key: 'entries', title: 'Fruit events',
    headers: ['Fruit ID', 'Crop', 'Event', 'Stage', 'Confidence (%)', 'Time (garden time)', 'Time (epoch ms)', 'Snapshot path'],
    rows: inFruit.flatMap(f => f.entries.map((e, i) => [f.id, f.crop, entryLabel(f, i), e.stage,
      Math.round(e.confidence * 100), isoGarden(e.timestamp), e.timestamp, e.framePath || ''])),
  }
  const newPerDay = {
    key: 'new_fruit_per_day', title: 'New fruit per day',
    headers: ['Date (garden time)', 'Crop', 'Underripe', 'Ripe', 'Damaged', 'Total'],
    rows: crops.flatMap(c => dailyRows(events.seen, days, c.id).map(r => [r.date, c.label, r.underripe, r.ripe, r.damaged, r.total])).sort(byDate),
  }
  const onPlant = {
    key: 'fruit_on_plant_per_day', title: 'Fruit on plant per day',
    headers: ['Date (garden time)', 'Crop', 'Underripe', 'Ripe', 'Damaged', 'Total on the plant'],
    rows: crops.flatMap(c => {
      const by = onPlantByStage(events.seen, days, c.id)
      return days.map((d, i) => [d, c.label, ...STAGES.map(s => by[s][i]), STAGES.reduce((n, s) => n + by[s][i], 0)])
    }).sort(byDate),
  }
  const monthly = {
    key: 'fruit_per_month', title: 'Fruit per month',
    headers: ['Month (garden time)', ...crops.map(c => `${c.label} first seen`), 'First seen (all)', 'Harvested'],
    rows: monthlyRows(events, crops.map(c => c.id), from, to).reverse()
      .map(r => [r.month, ...crops.map(c => r[c.id]), r.total, r.harvested]),
  }
  const ready = {
    key: 'harvest_ready_events', title: 'Harvest-ready events',
    headers: ['Time (garden time)', 'Time (epoch ms)', 'Crop', 'Fruit ID', 'Event'],
    rows: events.ready.filter(e => inRange(e.date, from, to)).sort((a, b) => a.ts - b.ts)
      .map(e => [isoGarden(e.ts), e.ts, e.crop, e.fruitId, e.kind]),
  }
  return [fruit, entries, newPerDay, onPlant, monthly, ready]
}