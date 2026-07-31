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
const ALLOWED_PLANTS = new Set(['tomato', 'okra', 'eggplant'])

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
    const plant = raw.plant.toLowerCase().trim().slice(0, 32)
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
