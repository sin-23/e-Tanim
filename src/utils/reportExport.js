// src/utils/reportExport.js
//
// Turns the report tables (utils/reportCsv.js) into one downloadable file: CSV or one Excel workbook (a Notes sheet plus one sheet per table).
// CSV is one file with the notes and all tables stacked (decided 15 Nov 2026).
// Excel writer: write-excel-file (write-only, multiple sheets, bold, fills, widths, frozen header row).
import { rowsToCsv, exportName, notesLines } from '@/utils/reportCsv'

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const HEADER_FILL = '#DCEFE0'

function tableSheet(t) {
  const widths = t.headers.map((h, i) => {
    const longest = t.rows.slice(0, 500).reduce((m, r) => Math.max(m, String(r[i] ?? '').length), h.length)
    return { width: Math.min(Math.max(longest + 2, 10), 42) }
  })
  const head = t.headers.map(h => ({ value: h, fontWeight: 'bold', backgroundColor: HEADER_FILL, wrap: true, alignVertical: 'center' }))
  const body = t.rows.map(r => r.map((v, i) => {
    if (v === '' || v === null || v === undefined) return null
    // Epoch milliseconds are 13 digits: show them whole instead of 1.79E+12.
    return /epoch ms/.test(t.headers[i]) ? { value: v, type: Number, format: '0' } : v
  }))
  return { data: [head, ...body], sheet: t.title, columns: widths, stickyRowsCount: 1 }
}

function notesSheet(lines) {
  return {
    data: lines.map((l, i) => [i === 0 ? { value: l, fontWeight: 'bold', fontSize: 13 } : { value: l, wrap: true }]),
    sheet: 'Notes', columns: [{ width: 110 }],
  }
}

/**
 * format: 'csv' | 'xlsx'. tables: [{ key, title, headers, rows, xlsxOnly? }].
 * workbook: the file name part for the workbook and the notes ('averages', 'detections').
 * meta: the same object notesLines takes, plus systemId, from, to.
 */
export async function packFiles({ format, tables, workbook, meta }) {
  const { systemId: id, from, to } = meta
  if (format === 'xlsx') {
    const { default: writeExcelFile } = await import('write-excel-file/universal')
    const blob = await writeExcelFile([
      notesSheet(notesLines(meta)),
      ...tables.map(tableSheet),
    ]).toBlob()
    return [{ name: exportName(id, from, to, workbook, 'xlsx'), blob, type: XLSX_TYPE }]
  }
  // CSV: one file. The notes come first, then each table under its title, separated by a blank row.
  const all = [...notesLines(meta).map(l => [l]), []]
  for (const t of tables.filter(t => !t.xlsxOnly)) all.push([t.title], t.headers, ...t.rows, [])
  return [{ name: exportName(id, from, to, workbook), text: rowsToCsv(all) }]
}