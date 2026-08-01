// src/security/rateLimiter.js
//
// Client-side rate limiter using token bucket algorithm.
// Used to cap Firebase reconnection retries, password-reset requests, and
// other repeated user-triggered actions, to prevent abuse/spam.
//
// NOTE: This is a client-side-only guard. Buckets are persisted to
// localStorage (not just in-memory) so a page refresh can't be used to
// bypass the limit — but it's still just a UX guard, not a substitute for
// Firebase's own server-side abuse protection on auth endpoints.

const DEFAULT_WINDOW_MS    = 15 * 60 * 1000  // 15 minutes
const DEFAULT_MAX_ATTEMPTS = 5
const STORAGE_PREFIX = 'ratelimit:'

// In-memory cache mirrors localStorage so repeated calls in the same tick
// don't need to re-parse JSON every time.
const buckets = new Map()

function storageKey(key) {
  return `${STORAGE_PREFIX}${key}`
}

function readBucket(key) {
  if (buckets.has(key)) return buckets.get(key)

  let attempts = []
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (raw) attempts = JSON.parse(raw)
    if (!Array.isArray(attempts)) attempts = []
  } catch {
    attempts = []
  }
  buckets.set(key, attempts)
  return attempts
}

function writeBucket(key, attempts) {
  buckets.set(key, attempts)
  try {
    if (attempts.length === 0) {
      localStorage.removeItem(storageKey(key))
    } else {
      localStorage.setItem(storageKey(key), JSON.stringify(attempts))
    }
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — fall back to
    // in-memory only, which still works within the current page session.
  }
}

/**
 * Check if an action identified by `key` is allowed under rate limiting.
 *
 * @param {string} key - identifier for the action (e.g. 'firebase-connect')
 * @param {object} [options]
 * @param {number} [options.windowMs]    - override the default 15 min window
 * @param {number} [options.maxAttempts] - override the default 5-attempt cap
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
export function checkRateLimit(key, options = {}) {
  const windowMs    = options.windowMs    ?? DEFAULT_WINDOW_MS
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const now = Date.now()

  // Purge timestamps outside the current window
  const attempts = readBucket(key).filter(ts => now - ts < windowMs)

  const remaining = Math.max(0, maxAttempts - attempts.length)
  const resetAt   = attempts.length > 0 ? attempts[0] + windowMs : now

  if (attempts.length >= maxAttempts) {
    writeBucket(key, attempts)
    return { allowed: false, remaining: 0, resetAt }
  }

  // Record this attempt
  attempts.push(now)
  writeBucket(key, attempts)

  return { allowed: true, remaining: remaining - 1, resetAt }
}

/**
 * Peek at the current state of a bucket without recording a new attempt.
 * Used on mount to restore an in-progress cooldown after a page reload.
 * @param {string} key
 * @param {object} [options]
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
export function peekRateLimit(key, options = {}) {
  const windowMs    = options.windowMs    ?? DEFAULT_WINDOW_MS
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const now = Date.now()

  const attempts = readBucket(key).filter(ts => now - ts < windowMs)
  const remaining = Math.max(0, maxAttempts - attempts.length)
  const resetAt   = attempts.length > 0 ? attempts[0] + windowMs : now

  return { allowed: attempts.length < maxAttempts, remaining, resetAt }
}

/**
 * Reset the rate limit bucket for a key (e.g. after successful connection).
 * @param {string} key
 */
export function resetRateLimit(key) {
  writeBucket(key, [])
}

/**
 * Returns a human-readable countdown string for when the limit resets.
 * @param {number} resetAt - epoch ms
 * @returns {string}
 */
export function formatResetTime(resetAt) {
  const diff = Math.max(0, resetAt - Date.now())
  const mins = Math.floor(diff / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  return `${mins}m ${secs}s`
}