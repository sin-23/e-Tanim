// src/security/rateLimiter.js
//
// Client-side rate limiter using token bucket algorithm.
// Used to cap Firebase reconnection retries and prevent runaway polling.
//
// NOTE: This app has no authentication routes, no login form, and no
// user-submitted endpoints — so "5 attempts per 15 min" is applied to
// Firebase connection retries (the only repeated operation in this app).

const WINDOW_MS    = 15 * 60 * 1000  // 15 minutes
const MAX_ATTEMPTS = 5

// Stores attempt timestamps per key — in-memory only, resets on page reload
const buckets = new Map()

/**
 * Check if an action identified by `key` is allowed under rate limiting.
 *
 * @param {string} key - identifier for the action (e.g. 'firebase-connect')
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
export function checkRateLimit(key) {
  const now = Date.now()

  if (!buckets.has(key)) {
    buckets.set(key, [])
  }

  // Purge timestamps outside the current window
  const attempts = buckets.get(key).filter(ts => now - ts < WINDOW_MS)
  buckets.set(key, attempts)

  const remaining = Math.max(0, MAX_ATTEMPTS - attempts.length)
  const resetAt   = attempts.length > 0 ? attempts[0] + WINDOW_MS : now

  if (attempts.length >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetAt }
  }

  // Record this attempt
  attempts.push(now)
  buckets.set(key, attempts)

  return { allowed: true, remaining: remaining - 1, resetAt }
}

/**
 * Reset the rate limit bucket for a key (e.g. after successful connection).
 * @param {string} key
 */
export function resetRateLimit(key) {
  buckets.delete(key)
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
