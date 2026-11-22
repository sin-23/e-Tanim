// src/utils/reportPdf.js
//
// Plain-language PDF reports for the Reports page (Phase 5e). Written for readers who are not
// technical (decision log item 47): a short explanation, one sentence per section, charts as pictures,
// and compact tables. The PDF follows the date range only, like the CSV and Excel exports.
// Charts are drawn off-screen with Chart.js in fixed light colors (so a report looks the same in
// light and dark mode and prints well), then added as PNG pictures. jsPDF is loaded when needed.
import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend,
} from 'chart.js'
import { isoGarden, detectionTables } from '@/utils/reportCsv'
import { onPlantByStage, inRange, STAGES } from '@/utils/detectionReport'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend)

const PDF_TYPE = 'application/pdf'
const COLORS = {
  primary: '#2d7a4f', sky: '#3b9dd2', earth: '#8b5e3c', eggplant: '#9c6bae',
  warn: '#b45309', danger: '#b91c1c', dim: '#6b8070', good: '#2d7a4f',
}

// ── Layout helper ───────────────────────────────────────────────────────────
const PAGE_W = 210, PAGE_H = 297, MARGIN = 15, CW = PAGE_W - 2 * MARGIN
const INK = [26, 46, 34], SOFT = [75, 90, 80], GREEN = [45, 122, 79]

class Pdf {
  constructor(jsPDF) {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
    this.y = MARGIN
    this.sections = []   // [{ page, title }]: the footer of a page names the report it belongs to
  }
  /** Starts a report. After the first one, it starts on a new page. */
  section(title) {
    if (this.sections.length) { this.doc.addPage(); this.y = MARGIN }
    this.sections.push({ page: this.doc.getNumberOfPages(), title })
  }
  need(h) {
    if (this.y + h > PAGE_H - MARGIN - 4) { this.doc.addPage(); this.y = MARGIN }
  }
  title(text, sub) {
    const d = this.doc
    d.setFont('helvetica', 'bold'); d.setFontSize(20); d.setTextColor(...INK)
    d.text(text, MARGIN, this.y + 7)
    d.setFillColor(...GREEN); d.rect(MARGIN, this.y + 10.5, 24, 1.2, 'F')
    this.y += 17
    for (const line of sub) { this.text(line, { size: 9.5, color: SOFT, gap: 0.5 }) }
    this.y += 3
  }
  /** keep: space (mm) that must fit under the heading, so a heading is never left alone at the page bottom. */
  heading(text, keep = 30) {
    this.need(keep)
    const d = this.doc
    this.y += 4
    d.setFont('helvetica', 'bold'); d.setFontSize(13); d.setTextColor(...GREEN)
    d.text(text, MARGIN, this.y + 5)
    this.y += 8
  }
  text(str, { size = 10, color = INK, gap = 2, bold = false } = {}) {
    const d = this.doc
    d.setFont('helvetica', bold ? 'bold' : 'normal'); d.setFontSize(size); d.setTextColor(...color)
    const lh = size * 0.46
    const lines = d.splitTextToSize(str, CW)
    this.need(lines.length * lh + gap)
    d.text(lines, MARGIN, this.y + lh * 0.85)
    this.y += lines.length * lh + gap
  }
  /** A light box with a bold title and short paragraphs. */
  box(title, paragraphs) {
    const d = this.doc
    const inner = CW - 8
    d.setFontSize(9.5)
    const wrapped = paragraphs.map(p => d.splitTextToSize(p, inner))
    const lh = 4.4
    const h = 8 + wrapped.reduce((n, l) => n + l.length * lh + 1.5, 0) + 2
    this.need(h)
    d.setFillColor(238, 245, 240); d.setDrawColor(216, 232, 222)
    d.roundedRect(MARGIN, this.y, CW, h, 2, 2, 'FD')
    d.setFont('helvetica', 'bold'); d.setFontSize(10); d.setTextColor(...GREEN)
    d.text(title, MARGIN + 4, this.y + 6)
    d.setFont('helvetica', 'normal'); d.setFontSize(9.5); d.setTextColor(...INK)
    let y = this.y + 11.5
    for (const lines of wrapped) { d.text(lines, MARGIN + 4, y); y += lines.length * lh + 1.5 }
    this.y += h + 3
  }
  image(dataUrl, ratio) {
    const h = CW * ratio
    this.need(h + 2)
    this.doc.addImage(dataUrl, 'PNG', MARGIN, this.y, CW, h, undefined, 'FAST')
    this.y += h + 3
  }
  /** head: [[{ text, span }]] header rows; widths in mm (sum CW); aligns: 'l' | 'r' per column. */
  table({ head, widths, aligns, rows, maxRows = 400 }) {
    const d = this.doc
    const RH = 5.6
    const clip = (s, w) => {
      s = String(s ?? '')
      if (d.getTextWidth(s) <= w - 2) return s
      while (s.length > 1 && d.getTextWidth(s + '...') > w - 2) s = s.slice(0, -1)
      return s + '...'
    }
    const drawHead = () => {
      d.setFont('helvetica', 'bold'); d.setFontSize(8)
      for (const hr of head) {
        let x = MARGIN, ci = 0
        d.setFillColor(222, 236, 227); d.rect(MARGIN, this.y, CW, RH, 'F')
        for (const c of hr) {
          const span = c.span || 1
          const w = widths.slice(ci, ci + span).reduce((a, b) => a + b, 0)
          d.setTextColor(...INK)
          const right = span === 1 && aligns[ci] === 'r'
          d.text(clip(c.text, w), right ? x + w - 1.2 : span > 1 ? x + w / 2 : x + 1.2, this.y + 3.9, { align: right ? 'right' : span > 1 ? 'center' : 'left' })
          x += w; ci += span
        }
        this.y += RH
      }
    }
    this.need(RH * (head.length + 2))
    drawHead()
    const shown = rows.slice(0, maxRows)
    shown.forEach((r, ri) => {
      if (this.y + RH > PAGE_H - MARGIN - 4) { d.addPage(); this.y = MARGIN; drawHead() }
      if (ri % 2) { d.setFillColor(247, 250, 248); d.rect(MARGIN, this.y, CW, RH, 'F') }
      d.setFont('helvetica', 'normal'); d.setFontSize(8); d.setTextColor(...INK)
      let x = MARGIN
      r.forEach((v, ci) => {
        const w = widths[ci]
        const right = aligns[ci] === 'r'
        d.text(clip(v, w), right ? x + w - 1.2 : x + 1.2, this.y + 3.9, { align: right ? 'right' : 'left' })
        x += w
      })
      this.y += RH
    })
    d.setDrawColor(216, 232, 222); d.line(MARGIN, this.y, MARGIN + CW, this.y)
    this.y += 2
    if (rows.length > maxRows) {
      this.text(`Showing the first ${maxRows} of ${rows.length} rows. The CSV and Excel exports have all of them.`, { size: 8.5, color: SOFT })
    }
    this.y += 1
  }
  finish() {
    const d = this.doc
    const n = d.getNumberOfPages()
    for (let i = 1; i <= n; i++) {
      d.setPage(i)
      d.setFont('helvetica', 'normal'); d.setFontSize(8); d.setTextColor(120, 135, 125)
      const title = [...this.sections].reverse().find(x => x.page <= i)?.title ?? ''
      d.text(`e-Tanim | ${title}`, MARGIN, PAGE_H - 8)
      d.text(`Page ${i} of ${n}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' })
    }
    return d.output('blob')
  }
}

// ── Charts, drawn off-screen ────────────────────────────────────────────────
/** datasets: [{ label, data, color, dashed?, width? }]. Returns { url, ratio } for a PNG picture. */
function chartPicture(labels, datasets, { yTitle = '', counts = false } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = 1500; canvas.height = 560
  const ink = '#4b5a50', grid = '#d8e8de'
  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map(d => ({
        label: d.label, data: d.data,
        borderColor: COLORS[d.color], backgroundColor: COLORS[d.color],
        borderWidth: (d.width ?? 2) * 2.2, borderDash: d.dashed ? [14, 10] : [],
        pointRadius: d.dashed || counts ? 0 : 4, tension: counts ? 0 : 0.25, spanGaps: false,
      })),
    },
    options: {
      responsive: false, animation: false, devicePixelRatio: 1,
      plugins: { legend: { position: 'bottom', labels: { color: ink, boxWidth: 34, boxHeight: 4, font: { size: 22, weight: '600' } } } },
      scales: {
        x: { ticks: { color: ink, maxRotation: 0, autoSkip: true, maxTicksLimit: 12, font: { size: 22 } }, grid: { color: grid, display: !counts } },
        y: {
          beginAtZero: counts, ticks: { color: ink, font: { size: 22 }, ...(counts ? { precision: 0 } : {}) }, grid: { color: grid },
          title: { display: !!yTitle, text: yTitle, color: ink, font: { size: 22, weight: '700' } },
        },
      },
    },
    plugins: [{
      id: 'whiteBackground',
      beforeDraw(c) { c.ctx.save(); c.ctx.fillStyle = '#ffffff'; c.ctx.fillRect(0, 0, c.width, c.height); c.ctx.restore() },
    }],
  })
  const url = canvas.toDataURL('image/png')
  chart.destroy()
  return { url, ratio: canvas.height / canvas.width }
}

const shortDate = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const fix = (v, n) => (v === null || v === undefined || Number.isNaN(v)) ? '-' : v.toFixed(n)
const stats = (vals) => {
  const v = vals.filter(x => x !== null && x !== undefined)
  return v.length ? { n: v.length, avg: v.reduce((a, b) => a + b, 0) / v.length, min: Math.min(...v), max: Math.max(...v) } : null
}

// ── Sensor Averages report ──────────────────────────────────────────────────
const METRICS = [
  { key: 'soilMoisture', title: 'Soil moisture', unit: '%',   dec: 1, what: 'soil moisture' },
  { key: 'temperature',  title: 'Temperature',   unit: null,  dec: 1, what: 'air temperature' },
  { key: 'humidity',     title: 'Humidity',      unit: '%',   dec: 1, what: 'relative humidity' },
  { key: 'vpd',          title: 'VPD (dryness of the air)', unit: 'kPa', dec: 2, what: 'VPD' },
]

/**
 * rows: Reports averages rows (newest first). thresholds: { lowland, highland } with smNormal, smEmergency,
 * smStop, vpdGate. toTemp: Celsius -> display unit. meta: { systemId, from, to, unit, rangeLabel }.
 * Returns the file entry for downloadFiles.
 */
function drawSensors(pdf, { rows, thresholds, toTemp, meta }) {
  pdf.section('Sensor Averages report')
  const asc = [...rows].sort((a, b) => (a.date < b.date ? -1 : 1))
  const unit = (m) => m.unit ?? `°${meta.unit}`
  const val = (r, zone, key) => {
    const v = r[zone].daily?.[key]
    if (v === undefined || v === null) return null
    return key === 'temperature' ? toTemp(v) : v
  }
  const lo = thresholds.lowland, hi = thresholds.highland

  pdf.title('e-Tanim Sensor Averages Report', [
    `System ${meta.systemId}`,
    `Dates: ${meta.from} to ${meta.to}${meta.rangeLabel ? ` (${meta.rangeLabel})` : ''}. ${asc.length} day${asc.length === 1 ? '' : 's'} with data.`,
    `Prepared ${isoGarden(Date.now())}. All dates use garden time (Philippine time, UTC+8).`,
  ])

  pdf.heading('What this report shows')
  pdf.text('e-Tanim measures soil moisture, air temperature and humidity in two zones: the lowland zone (tomato and eggplant) and the highland zone (bell pepper). '
    + 'Every day is summarized in three periods (morning, afternoon and night). The daily value in this report is the average of the periods that have data, '
    + 'counting each period by how many readings it had.')
  pdf.box('Two terms explained', [
    'VPD (vapor pressure deficit) shows how strongly the air pulls water out of the plants, in kilopascals (kPa). Low VPD means damp air and plants lose little water; '
    + 'high VPD means dry air and plants lose water quickly. '
    + `e-Tanim does not start a normal watering session unless VPD is at least ${lo.vpdGate} kPa${lo.vpdGate === hi.vpdGate ? '' : ` (lowland) and ${hi.vpdGate} kPa (highland)`}.`,
    `Soil moisture levels that control watering: a normal session starts when soil moisture falls to the normal-start level (lowland ${lo.smNormal}%, highland ${hi.smNormal}%) and the VPD condition is met. `
    + `If soil moisture drops to the emergency level (lowland ${lo.smEmergency}%, highland ${hi.smEmergency}%), watering starts regardless of VPD. Watering stops at the stop level (lowland ${lo.smStop}%, highland ${hi.smStop}%).`,
  ])

  const labels = asc.map(r => shortDate(r.date))
  const days = asc.length

  for (const m of METRICS) {
    const L = asc.map(r => val(r, 'lowland', m.key)), H = asc.map(r => val(r, 'highland', m.key))
    const sl = stats(L), sh = stats(H)
    const part = (name, s) => s
      ? `${name}: average ${fix(s.avg, m.dec)} ${unit(m)}, from ${fix(s.min, m.dec)} to ${fix(s.max, m.dec)}`
      : `${name}: no data`
    let sentence = `Daily ${m.what}, as the average of the daily values. ${part('Lowland zone', sl)}. ${part('Highland zone', sh)}.`
    if (m.key === 'soilMoisture' && sl) {
      const k = L.filter(v => v !== null && v <= lo.smNormal).length
      sentence += ` The lowland zone was at or below its normal-start level on ${k} of ${sl.n} days.`
    }
    if (m.key === 'vpd') {
      const kl = L.filter(v => v !== null && v < lo.vpdGate).length
      const kh = H.filter(v => v !== null && v < hi.vpdGate).length
      if (sl || sh) sentence += ` The air was below the VPD gate on ${kl} lowland day${kl === 1 ? '' : 's'} and ${kh} highland day${kh === 1 ? '' : 's'}, which are days when a normal watering session would not have started.`
    }
    let pic = null
    if (sl || sh) {
      const sets = [
        { label: 'Lowland', data: L, color: 'primary' },
        { label: 'Highland', data: H, color: 'sky' },
      ]
      if (m.key === 'soilMoisture') {
        sets.push({ label: `Lowland normal start (${lo.smNormal}%)`, data: labels.map(() => lo.smNormal), color: 'primary', dashed: true, width: 1.2 })
        sets.push({ label: `Highland normal start (${hi.smNormal}%)`, data: labels.map(() => hi.smNormal), color: 'sky', dashed: true, width: 1.2 })
      }
      if (m.key === 'vpd') {
        sets.push({ label: `VPD gate (${lo.vpdGate} kPa)`, data: labels.map(() => lo.vpdGate), color: 'danger', dashed: true, width: 1.2 })
      }
      pic = chartPicture(labels, sets, { yTitle: unit(m) })
    }
    // Heading, sentence and chart stay together on one page.
    pdf.heading(m.title, 12 + 20 + (pic ? CW * pic.ratio : 0))
    pdf.text(sentence)
    if (pic) pdf.image(pic.url, pic.ratio)
  }

  pdf.heading('Daily averages')
  pdf.text(`One row per day. Temperature is in °${meta.unit}. A dash means no data for that day. Minimum, maximum and period values are in the CSV and Excel exports.`, { size: 9, color: SOFT })
  const w0 = 24, wc = (CW - w0) / 8
  pdf.table({
    head: [
      [{ text: '' }, { text: 'Lowland zone', span: 4 }, { text: 'Highland zone', span: 4 }],
      [{ text: 'Date' }, ...['Soil %', `Temp °${meta.unit}`, 'Humid. %', 'VPD kPa', 'Soil %', `Temp °${meta.unit}`, 'Humid. %', 'VPD kPa'].map(t => ({ text: t }))],
    ],
    widths: [w0, ...Array(8).fill(wc)],
    aligns: ['l', ...Array(8).fill('r')],
    rows: [...asc].reverse().map(r => [r.date,
      ...['lowland', 'highland'].flatMap(z => METRICS.map(m => fix(val(r, z, m.key), m.dec)))]),
    maxRows: 200,
  })
  if (!days) pdf.text('No daily data was found for this range.')
}
export async function sensorsPdf(args) {
  const { jsPDF } = await import('jspdf')
  const pdf = new Pdf(jsPDF)
  drawSensors(pdf, args)
  return { name: args.meta.name, blob: pdf.finish(), type: PDF_TYPE }
}

// ── Detections report ───────────────────────────────────────────────────────
/**
 * fruits: Reports fruit rows. events: buildEvents() result. days: list of garden dates. crops: [{id,label}].
 * meta: { systemId, from, to, rangeLabel, name }. from/to on ctx may be null (all).
 */
function drawDetections(pdf, { fruits, events, crops, days, from, to, meta }) {
  pdf.section('Detections report')
  const tables = Object.fromEntries(detectionTables({ fruits, events, crops, days, from, to }).map(t => [t.key, t]))
  const seen = events.seen.filter(e => inRange(e.date, from, to))
  const harv = events.harvested.filter(e => inRange(e.date, from, to))
  const byUser = harv.filter(e => e.by === 'user').length
  const ready = events.ready.filter(e => inRange(e.date, from, to))
  const perCrop = crops.map(c => `${seen.filter(e => e.cropId === c.id).length} ${c.label.toLowerCase()}`).join(', ')
  const active = fruits.filter(f => f.status === 'Active')
  const stageNow = (s) => active.filter(f => f.stage === s).length

  pdf.title('e-Tanim Detections Report', [
    `System ${meta.systemId}`,
    `Dates: ${meta.from} to ${meta.to}${meta.rangeLabel ? ` (${meta.rangeLabel})` : ''}.`,
    `Prepared ${isoGarden(Date.now())}. All dates use garden time (Philippine time, UTC+8).`,
  ])

  pdf.heading('What this report shows')
  pdf.text('A camera and an AI model on the Mini PC look for fruit on the plants every 10 minutes. Each fruit gets its own ID and is followed over time. '
    + 'A fruit is recorded when it is first seen and again when it changes stage (underripe, ripe or damaged). A fruit counts as harvested when the user marks it harvested, '
    + 'or when it has not been seen for 48 hours.')
  pdf.box('How fruit are counted', [
    'Each fruit is counted once, on the day it was first seen, by its current stage. A fruit is on the plant from the day it was first seen through its harvest day. '
    + 'For a fruit presumed harvested, the harvest day is the last day it was seen.',
  ])

  pdf.heading('Summary')
  pdf.text(`${seen.length} fruit ${seen.length === 1 ? 'was' : 'were'} first seen in this range (${perCrop}). `
    + `${harv.length} ${harv.length === 1 ? 'was' : 'were'} harvested: ${byUser} marked by a user and ${harv.length - byUser} presumed. `
    + `The system flagged ${ready.length} ripe detection${ready.length === 1 ? '' : 's'}.`)
  pdf.text(`Right now (at the time of this report) ${active.length} fruit ${active.length === 1 ? 'is' : 'are'} on the plants: ${stageNow('underripe')} underripe, ${stageNow('ripe')} ripe and ${stageNow('damaged')} damaged.`)

  pdf.heading('Fruit on the plant, per day', 12 + 10 + CW * (560 / 1500))
  const by = onPlantByStage(events.seen, days, null)
  const any = STAGES.some(s => by[s].some(n => n > 0))
  if (any) {
    pdf.text('All crops combined. Each line counts the fruit on the plant that day, by the stage it had that day.', { size: 9.5, color: SOFT })
    const pic = chartPicture(days.map(shortDate), [
      { label: 'Underripe', data: by.underripe, color: 'dim' },
      { label: 'Ripe', data: by.ripe, color: 'good' },
      { label: 'Damaged', data: by.damaged, color: 'danger' },
    ], { yTitle: 'Fruit on the plant', counts: true })
    pdf.image(pic.url, pic.ratio)
  } else {
    pdf.text('No fruit were on the plants in this range.')
  }

  pdf.heading('Fruit per month', 40)
  const mt = tables.fruit_per_month
  if (mt.rows.length) {
    const wm = 32, wr = (CW - wm) / (mt.headers.length - 1)
    pdf.table({
      head: [mt.headers.map(h => ({ text: h.replace(' (garden time)', '').replace(' first seen', '') }))],
      widths: [wm, ...Array(mt.headers.length - 1).fill(wr)],
      aligns: ['l', ...Array(mt.headers.length - 1).fill('r')],
      rows: mt.rows,
    })
    pdf.text('Crop columns and "First seen (all)" count fruit on the day each fruit first appeared. Harvested is counted on the harvest day.', { size: 8.5, color: SOFT })
  } else pdf.text('No fruit in this range.')

  pdf.heading('Harvest-ready events', 45)
  const rt = tables.harvest_ready_events
  if (rt.rows.length) {
    pdf.text(`${rt.rows.length} ripe detection${rt.rows.length === 1 ? '' : 's'} in this range. The newest 30 are listed. The first ripe detection of a fruit is "Ripe detected"; later ones are daily reminders.`, { size: 9.5, color: SOFT })
    const recent = [...rt.rows].reverse().slice(0, 30)
    pdf.table({
      head: [[{ text: 'When (garden time)' }, { text: 'Crop' }, { text: 'Fruit ID' }, { text: 'Event' }]],
      widths: [52, 36, 42, CW - 130],
      aligns: ['l', 'l', 'l', 'l'],
      rows: recent.map(r => [r[0].replace('T', ' ').replace('+08:00', ''), r[2], r[3], r[4]]),
    })
  } else pdf.text('No ripe detections in this range.')

  pdf.text('The full fruit list and every event are in the CSV and Excel exports.', { size: 9, color: SOFT })
}
export async function detectionsPdf(args) {
  const { jsPDF } = await import('jspdf')
  const pdf = new Pdf(jsPDF)
  drawDetections(pdf, args)
  return { name: args.meta.name, blob: pdf.finish(), type: PDF_TYPE }
}

// ── Everything: one PDF with both reports ───────────────────────────────────
/**
 * parts: [{ kind: 'sensors' | 'detections', args }] where args is what sensorsPdf or detectionsPdf takes.
 * Sensor Averages comes first, Detections starts on a new page. name: the file name.
 */
export async function combinedPdf({ parts, name }) {
  const { jsPDF } = await import('jspdf')
  const pdf = new Pdf(jsPDF)
  for (const kind of ['sensors', 'detections']) {
    const part = parts.find(p => p.kind === kind)
    if (!part) continue
    if (kind === 'sensors') drawSensors(pdf, part.args); else drawDetections(pdf, part.args)
  }
  return { name, blob: pdf.finish(), type: PDF_TYPE }
}