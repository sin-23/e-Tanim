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
// Matches the database rules: levelPct 0-100, low boolean, updatedAt epoch ms,
// any other key is rejected.
export const RESERVOIR_LOW_PCT = 30   // paper: low at 30% of capacity or below

const RESERVOIR_FIELDS = new Set(['levelPct', 'low', 'updatedAt'])

/**
 * @param {unknown} raw - raw snapshot.val() of reservoirs/{name}
 * @returns {{ ok: true, data: { levelPct: number|null, low: boolean, updatedAt: number|null } } | { ok: false, error: string }}
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

  const { levelPct, low, updatedAt } = raw
  if (levelPct !== undefined && levelPct !== null) {
    if (typeof levelPct !== 'number' || !isFinite(levelPct) || levelPct < 0 || levelPct > 100) {
      return { ok: false, error: "Field 'levelPct' must be a number from 0 to 100." }
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

// ── Harvest detection payloads (detections/{tomato|eggplant|bell_pepper}) ────
// Written by the Mini PC. Matches the database rules: underripe/ripe/damaged
// are counts (0 or more), confidence is 0-1, updatedAt is epoch ms, and any
// other key is rejected.
export const DETECTION_CROPS = ['tomato', 'eggplant', 'bell_pepper']

const DETECTION_FIELDS = new Set(['underripe', 'ripe', 'damaged', 'confidence', 'updatedAt'])

/**
 * @param {unknown} raw - raw snapshot.val() of detections/{crop}
 * @returns {{ ok: true, data: { underripe: number, ripe: number, damaged: number, confidence: number|null, updatedAt: number|null } } | { ok: false, error: string }}
 */
export function validateDetectionPayload(raw) {
  if (raw === null || raw === undefined) return { ok: false, error: 'No data at this path.' }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Malformed payload: expected object.' }
  }
  if (JSON.stringify(raw).length > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: 'Oversized payload.' }
  }
  const unknown = Object.keys(raw).filter(k => !DETECTION_FIELDS.has(k))
  if (unknown.length > 0) {
    return { ok: false, error: `Unexpected fields in payload: ${unknown.join(', ')}` }
  }

  for (const field of ['underripe', 'ripe', 'damaged']) {
    const v = raw[field]
    if (v === undefined || v === null) continue
    if (typeof v !== 'number' || !isFinite(v) || v < 0) {
      return { ok: false, error: `Field '${field}' must be a count of 0 or more.` }
    }
  }
  const { confidence, updatedAt } = raw
  if (confidence !== undefined && confidence !== null) {
    if (typeof confidence !== 'number' || !isFinite(confidence) || confidence < 0 || confidence > 1) {
      return { ok: false, error: "Field 'confidence' must be a number from 0 to 1." }
    }
  }
  if (updatedAt !== undefined && updatedAt !== null) {
    if (typeof updatedAt !== 'number' || !isFinite(updatedAt) || updatedAt <= 0) {
      return { ok: false, error: "Field 'updatedAt' must be a positive number." }
    }
  }

  const count = (v) => (typeof v === 'number' ? Math.floor(v) : 0)
  return {
    ok: true,
    data: {
      underripe:  count(raw.underripe),
      ripe:       count(raw.ripe),
      damaged:    count(raw.damaged),
      confidence: typeof confidence === 'number' ? +confidence.toFixed(2) : null,
      updatedAt:  typeof updatedAt  === 'number' ? Math.floor(updatedAt)  : null,
    },
  }
}

// ── Notification payloads (notifications/{notificationId}) ───────────────────
// Written by the ESP32 (reservoir_low) or the Mini PC (harvest_ready); the
// dashboard only reads. Matches the paper schema: type, source, message,
// createdAt. Any other key is rejected.
export const NOTIFICATION_TYPES = ['reservoir_low', 'harvest_ready']

const NOTIFICATION_FIELDS = new Set(['type', 'source', 'message', 'createdAt'])
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
    return { ok: false, error: "Field 'type' must be reservoir_low or harvest_ready." }
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

  // Accept epoch seconds as well as epoch ms (values below 1e12 are seconds).
  const ms = createdAt < 1e12 ? Math.floor(createdAt * 1000) : Math.floor(createdAt)
  return {
    ok: true,
    data: { type, source: typeof source === 'string' ? source : '', message, createdAt: ms },
  }
}