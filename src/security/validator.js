// src/security/validator.js
//
// Validates and sanitizes all data received from Firebase RTDB before it
// touches the UI. Rejects malformed, oversized, or out-of-range payloads.

// ── Payload size limit ────────────────────────────────────────────────────────
// A single zone sensor snapshot should never exceed 1 KB.
const MAX_PAYLOAD_BYTES = 1024

// ── Allowed field names — reject any unknown keys ─────────────────────────────
const ALLOWED_FIELDS = new Set([
  'moisture', 'temperature', 'humidity', 'updatedAt', 'plant'
])

// ── Numeric sensor bounds (hard physical limits) ─────────────────────────────
const SENSOR_BOUNDS = {
  moisture:    { min: 0,    max: 100  },
  temperature: { min: -40,  max: 85   },   // sensor operating range
  humidity:    { min: 0,    max: 100  },
  updatedAt:   { min: 0,    max: 9999999999999 },  // epoch ms
}

// ── Allowed plant names (whitelist) ──────────────────────────────────────────
const ALLOWED_PLANTS = new Set(['tomato', 'eggplant', 'bell_pepper'])

/**
 * Sanitizes a raw Firebase snapshot value for a single zone.
 *
 * @param {unknown} raw  - raw snapshot.val()
 * @param {string}  zoneId - zone identifier for error context
 * @returns {{ ok: true, data: object } | { ok: false, error: string }}
 */
export function validateSensorPayload(raw, zoneId) {
  // ── 1. Null / missing ────────────────────────────────────────────────────
  if (raw === null || raw === undefined) {
    return { ok: false, error: 'No data at this path.' }
  }

  // ── 2. Must be a plain object ────────────────────────────────────────────
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Malformed payload: expected object.' }
  }

  // ── 3. Payload size guard ────────────────────────────────────────────────
  let serialized
  try {
    serialized = JSON.stringify(raw)
  } catch {
    return { ok: false, error: 'Malformed payload: not serializable.' }
  }

  if (serialized.length > MAX_PAYLOAD_BYTES) {
    return {
      ok: false,
      error: `Oversized payload: ${serialized.length} bytes exceeds ${MAX_PAYLOAD_BYTES}B limit.`,
    }
  }

  // ── 4. Reject unknown fields ──────────────────────────────────────────────
  const unknownFields = Object.keys(raw).filter(k => !ALLOWED_FIELDS.has(k))
  if (unknownFields.length > 0) {
    return {
      ok: false,
      error: `Unexpected fields in payload: ${unknownFields.join(', ')}`,
    }
  }

  // ── 5. Validate numeric sensor fields ─────────────────────────────────────
  const numericFields = ['moisture', 'temperature', 'humidity', 'updatedAt']
  for (const field of numericFields) {
    const val = raw[field]
    if (val === undefined || val === null) continue  // optional — UI shows '—'

    if (typeof val !== 'number' || !isFinite(val)) {
      return { ok: false, error: `Field '${field}' must be a finite number.` }
    }

    const bounds = SENSOR_BOUNDS[field]
    if (val < bounds.min || val > bounds.max) {
      return {
        ok: false,
        error: `Field '${field}' value ${val} is out of bounds [${bounds.min}, ${bounds.max}].`,
      }
    }
  }

  // ── 6. Validate plant name if present ────────────────────────────────────
  if (raw.plant !== undefined) {
    if (typeof raw.plant !== 'string') {
      return { ok: false, error: "Field 'plant' must be a string." }
    }
    // Sanitize: lowercase, trim, max 32 chars
    const plant = raw.plant.toLowerCase().trim().replace(/[\s-]+/g, '_').slice(0, 32)  // 'Bell Pepper' -> 'bell_pepper'
    if (!ALLOWED_PLANTS.has(plant)) {
      return { ok: false, error: `Unknown plant '${plant}'.` }
    }
  }

  // ── 7. Return clean, typed, sanitized data ────────────────────────────────
  return {
    ok: true,
    data: {
      moisture:    typeof raw.moisture    === 'number' ? +raw.moisture.toFixed(1)    : null,
      temperature: typeof raw.temperature === 'number' ? +raw.temperature.toFixed(1) : null,
      humidity:    typeof raw.humidity    === 'number' ? +raw.humidity.toFixed(1)    : null,
      updatedAt:   typeof raw.updatedAt   === 'number' ? Math.floor(raw.updatedAt)   : Date.now(),
    },
  }
}

// ── Reservoir payloads (reservoirs/{water|fertilizer}) ───────────────────────
// Matches the deployed database rules: level 0-100, low boolean, updatedAt
// epoch ms, any other key is rejected. The rules field is "level" (decision
// log item 13 / flag F9 — the paper's earlier "levelPct" name is legacy on
// the dashboard side only; the wire field has always been "level").
export const RESERVOIR_LOW_PCT = 30   // paper: low at 30% of capacity or below

const RESERVOIR_FIELDS = new Set(['level', 'low', 'updatedAt'])

/**
 * @param {unknown} raw - raw snapshot.val() of reservoirs/{name}
 * @returns {{ ok: true, data: { levelPct: number|null, low: boolean, updatedAt: number|null } } | { ok: false, error: string }}
 *
 * Note: the wire field is "level" (matches the deployed rules). The returned
 * `data.levelPct` name is kept as-is so ReservoirCard.vue and useReservoirs.js
 * don't need to change.
 */
export function validateReservoirPayload(raw) {
  if (raw === null || raw === undefined) return { ok: false, error: 'No data at this path.' }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Malformed payload: expected object.' }
  }
  if (JSON.stringify(raw).length > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: 'Oversized payload.' }
  }
  const unknown = Object.keys(raw).filter(k => !RESERVOIR_FIELDS.has(k))
  if (unknown.length > 0) {
    return { ok: false, error: `Unexpected fields in payload: ${unknown.join(', ')}` }
  }

  const { level: levelPct, low, updatedAt } = raw
  if (levelPct !== undefined && levelPct !== null) {
    if (typeof levelPct !== 'number' || !isFinite(levelPct) || levelPct < 0 || levelPct > 100) {
      return { ok: false, error: "Field 'level' must be a number from 0 to 100." }
    }
  }
  if (low !== undefined && low !== null && typeof low !== 'boolean') {
    return { ok: false, error: "Field 'low' must be a boolean." }
  }
  if (updatedAt !== undefined && updatedAt !== null) {
    if (typeof updatedAt !== 'number' || !isFinite(updatedAt) || updatedAt <= 0) {
      return { ok: false, error: "Field 'updatedAt' must be a positive number." }
    }
  }

  const pct = typeof levelPct === 'number' ? +levelPct.toFixed(1) : null
  return {
    ok: true,
    data: {
      levelPct:  pct,
      // Trust the level over the flag if they disagree, so a stale flag can't hide a low tank.
      low:       (pct !== null && pct <= RESERVOIR_LOW_PCT) || low === true,
      updatedAt: typeof updatedAt === 'number' ? Math.floor(updatedAt) : null,
    },
  }
}

// ── Fruit records (detections/{crop}/{fruitId}) ──────────────────────────────
// Written by the Mini PC AI Inference on events only; the dashboard writes only
// harvested and harvestedAt. Matches the database rules.
export const DETECTION_CROPS = ['tomato', 'eggplant', 'bell_pepper']

const FRUIT_FIELDS = new Set(['stage', 'confidence', 'firstSeen', 'updatedAt', 'harvested', 'harvestedAt', 'entries'])
const FRUIT_STAGES = new Set(['underripe', 'ripe', 'damaged'])
const MAX_FRUITS_PER_CROP = 2000

const isEpoch = (v) => typeof v === 'number' && isFinite(v) && v > 0

// An entry's framePath is the part under the system: frames/{crop}/{file}
// (decision log item 52). The dashboard adds systems/{systemId}/ itself, so a
// stored value can never point outside this system's frames.
export const FRAME_PATH_RE = /^frames\/(tomato|eggplant|bell_pepper)\/[A-Za-z0-9._-]{1,120}$/
const MAX_ENTRIES_PER_FRUIT = 200

/**
 * Validate the entries/ child of one fruit. Invalid entries are skipped. Sorted
 * oldest first. An entry with no usable framePath is kept, with framePath null.
 * @returns {Array<{ id: string, stage: string, confidence: number, timestamp: number, framePath: string|null }>}
 */
export function validateEntries(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  const out = []
  for (const [id, e] of Object.entries(raw).slice(0, MAX_ENTRIES_PER_FRUIT)) {
    if (!e || typeof e !== 'object') continue
    if (!FRUIT_STAGES.has(e.stage)) continue
    if (typeof e.confidence !== 'number' || e.confidence < 0 || e.confidence > 1) continue
    if (!isEpoch(e.timestamp)) continue
    out.push({
      id,
      stage: e.stage,
      confidence: e.confidence,
      timestamp: e.timestamp,
      framePath: typeof e.framePath === 'string' && FRAME_PATH_RE.test(e.framePath) ? e.framePath : null,
    })
  }
  return out.sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Validate one fruit record, detections/{crop}/{fruitId}. The fruit ID is a
 * string and is never parsed. entries/ is read with validateEntries().
 * @returns {{ ok: true, data: object } | { ok: false, error: string }}
 */
export function validateFruitPayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Malformed fruit record.' }
  }
  const unknown = Object.keys(raw).filter(k => !FRUIT_FIELDS.has(k))
  if (unknown.length > 0) return { ok: false, error: `Unexpected fields: ${unknown.join(', ')}` }
  if (!FRUIT_STAGES.has(raw.stage)) return { ok: false, error: "Field 'stage' is not a known stage." }
  if (typeof raw.confidence !== 'number' || raw.confidence < 0 || raw.confidence > 1) {
    return { ok: false, error: "Field 'confidence' must be a number from 0 to 1." }
  }
  if (!isEpoch(raw.firstSeen) || !isEpoch(raw.updatedAt)) {
    return { ok: false, error: "Fields 'firstSeen' and 'updatedAt' must be positive numbers." }
  }
  if (raw.harvested !== undefined && typeof raw.harvested !== 'boolean') {
    return { ok: false, error: "Field 'harvested' must be true or false." }
  }
  if (raw.harvestedAt !== undefined && !isEpoch(raw.harvestedAt)) {
    return { ok: false, error: "Field 'harvestedAt' must be a positive number." }
  }
  return {
    ok: true,
    data: {
      stage: raw.stage,
      confidence: raw.confidence,
      firstSeen: raw.firstSeen,
      updatedAt: raw.updatedAt,
      harvested: raw.harvested === true,
      harvestedAt: raw.harvestedAt ?? null,
      entries: validateEntries(raw.entries),
    },
  }
}

/**
 * Validate every fruit of one crop, detections/{crop}. Invalid records are skipped.
 * @returns {{ fruits: Array<object>, skipped: number }}
 */
export function validateCropFruits(raw) {
  const fruits = []
  let skipped = 0
  if (raw && typeof raw === 'object') {
    for (const [id, rec] of Object.entries(raw).slice(0, MAX_FRUITS_PER_CROP)) {
      const res = validateFruitPayload(rec)
      if (res.ok) fruits.push({ id, ...res.data })
      else skipped++
    }
  }
  return { fruits, skipped }
}

// ── Notification payloads (notifications/{notificationId}) ───────────────────
// Written by the ESP32 (reservoir_low) or the Mini PC (harvest_ready,
// harvest_check). Paper schema: type, source, message, createdAt.
// harvest_check also carries crop, fruitId and harvestedAt (the value on the
// fruit when the check was written, so Undo can restore it). Members may add
// only resolution, resolvedBy and resolvedAt (decision log item 51).
// Any other key is rejected.
export const NOTIFICATION_TYPES = ['reservoir_low', 'harvest_ready', 'harvest_check']
export const NOTIFICATION_RESOLUTIONS = ['not_harvested', 'dismissed']

const NOTIFICATION_FIELDS = new Set([
  'type', 'source', 'message', 'createdAt',
  'crop', 'fruitId', 'harvestedAt',
  'resolution', 'resolvedBy', 'resolvedAt',
])
const NOTIFICATION_CROPS = ['tomato', 'eggplant', 'bell_pepper']
const NOTIFICATION_MAX_TEXT = 200

/**
 * @param {unknown} raw - raw child value of notifications/{id}
 * @returns {{ ok: true, data: { type: string, source: string, message: string, createdAt: number } } | { ok: false, error: string }}
 */
export function validateNotificationPayload(raw) {
  if (raw === null || raw === undefined || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Malformed notification.' }
  }
  if (JSON.stringify(raw).length > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: 'Oversized notification.' }
  }
  const unknown = Object.keys(raw).filter(k => !NOTIFICATION_FIELDS.has(k))
  if (unknown.length > 0) {
    return { ok: false, error: `Unexpected fields: ${unknown.join(', ')}` }
  }

  const { type, source, message, createdAt } = raw
  if (!NOTIFICATION_TYPES.includes(type)) {
    return { ok: false, error: "Field 'type' must be reservoir_low, harvest_ready or harvest_check." }
  }
  if (typeof message !== 'string' || message.length === 0 || message.length > NOTIFICATION_MAX_TEXT) {
    return { ok: false, error: "Field 'message' must be a string up to 200 characters." }
  }
  if (source !== undefined && source !== null &&
      (typeof source !== 'string' || source.length > 64)) {
    return { ok: false, error: "Field 'source' must be a string up to 64 characters." }
  }
  if (typeof createdAt !== 'number' || !isFinite(createdAt) || createdAt <= 0) {
    return { ok: false, error: "Field 'createdAt' must be a positive number." }
  }

  // Harvest check fields (all optional, checked when present)
  const { crop, fruitId, harvestedAt, resolution, resolvedBy, resolvedAt } = raw
  if (crop !== undefined && !NOTIFICATION_CROPS.includes(crop)) {
    return { ok: false, error: "Field 'crop' is not a known crop." }
  }
  if (fruitId !== undefined && (typeof fruitId !== 'string' || fruitId.length === 0 || fruitId.length > 64)) {
    return { ok: false, error: "Field 'fruitId' must be a string up to 64 characters." }
  }
  if (harvestedAt !== undefined && (typeof harvestedAt !== 'number' || !isFinite(harvestedAt) || harvestedAt <= 0)) {
    return { ok: false, error: "Field 'harvestedAt' must be a positive number." }
  }
  if (resolution !== undefined && !NOTIFICATION_RESOLUTIONS.includes(resolution)) {
    return { ok: false, error: "Field 'resolution' must be not_harvested or dismissed." }
  }
  if (resolvedBy !== undefined && (typeof resolvedBy !== 'string' || resolvedBy.length === 0 || resolvedBy.length > 100)) {
    return { ok: false, error: "Field 'resolvedBy' must be a string up to 100 characters." }
  }
  if (resolvedAt !== undefined && (typeof resolvedAt !== 'number' || !isFinite(resolvedAt) || resolvedAt <= 0)) {
    return { ok: false, error: "Field 'resolvedAt' must be a positive number." }
  }

  // Accept epoch seconds as well as epoch ms (values below 1e12 are seconds).
  const ms = createdAt < 1e12 ? Math.floor(createdAt * 1000) : Math.floor(createdAt)
  const data = { type, source: typeof source === 'string' ? source : '', message, createdAt: ms }
  if (crop !== undefined)        data.crop = crop
  if (fruitId !== undefined)     data.fruitId = fruitId
  if (harvestedAt !== undefined) data.harvestedAt = harvestedAt
  if (resolution !== undefined)  data.resolution = resolution
  if (resolvedBy !== undefined)  data.resolvedBy = resolvedBy
  if (resolvedAt !== undefined)  data.resolvedAt = resolvedAt
  return { ok: true, data }
}