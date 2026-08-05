// src/auth/useDeviceAccessCode.js
//
// Looks up and claims "device access codes" — short codes printed as a QR
// code (and as plain text) on each physical e-Tanim unit. A code must be
// verified here before RegisterView unlocks the account-creation form.
//
// IMPORTANT — read this before relying on it in production:
// This is a client-side UX gate, not a hard security boundary. The lookup
// happens BEFORE the user is authenticated, so per Firebase RTDB rules it
// has to be a public read (see database.rules.json: "deviceAccessCodes").
// A technically determined person could still read the codes list directly
// via the Firebase REST API and register without ever opening the app.
// Treat this the same way you'd treat an invite code: it keeps out casual/
// opportunistic sign-ups, not a motivated attacker. For a hard guarantee
// (e.g. once this goes past a class prototype), move validation into a
// Cloud Function that mints a custom token only for a valid, unclaimed
// code, and stop exposing the codes list to unauthenticated reads.

import { db } from '@/firebase'
import { ref as dbRef, get, update, runTransaction } from 'firebase/database'

// Codes are short, human-typeable, and case-insensitive (normalized to
// upper-case) so the "enter code manually" fallback isn't painful on mobile.
const CODE_PATTERN = /^[A-Z0-9]{6,12}$/

export function normalizeCode(raw) {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

/**
 * A scanned QR payload may just be the bare code (e.g. "ET-7F3K2Q") or a
 * URL that carries it, e.g. "https://e-tanim.app/claim?code=ET-7F3K2Q".
 * This pulls the code out either way.
 */
export function extractCodeFromScan(rawValue) {
  const value = String(rawValue ?? '').trim()
  try {
    const url = new URL(value)
    const fromQuery = url.searchParams.get('code')
    if (fromQuery) return normalizeCode(fromQuery)
  } catch {
    // Not a URL — fall through and treat the whole string as the code.
  }
  return normalizeCode(value)
}

/**
 * Checks whether a device access code exists and hasn't been claimed yet.
 * Read-only — does NOT claim the code. Claiming happens after the account
 * is actually created (see claimDeviceAccessCode) so a code isn't burned
 * if the user backs out of the registration form.
 *
 * @returns {Promise<{ ok: true, systemId: string } | { ok: false, error: string }>}
 */
export async function checkDeviceAccessCode(code) {
  const normalized = normalizeCode(code)

  if (!CODE_PATTERN.test(normalized)) {
    return { ok: false, error: 'That doesn\'t look like a valid device code.' }
  }

  let snap
  try {
    snap = await get(dbRef(db, `deviceAccessCodes/${normalized}`))
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection and try again.' }
  }

  if (!snap.exists()) {
    return { ok: false, error: 'Code not recognized. Double-check the QR code on your e-Tanim unit.' }
  }

  const entry = snap.val()
  if (entry.claimed) {
    return { ok: false, error: 'This device has already been registered to an account.' }
  }

  return { ok: true, systemId: entry.systemId ?? normalized, code: normalized }
}

/**
 * Marks a device access code as claimed by a newly-created user. Called
 * right after createUserWithEmailAndPassword()/signInWithPopup() succeeds,
 * once the caller is authenticated (RTDB rules require auth for this write).
 * Uses a transaction so two people finishing registration with the same
 * code at the same moment can't both "win" the claim.
 */
export async function claimDeviceAccessCode(code, uid) {
  const normalized = normalizeCode(code)
  const codeRef = dbRef(db, `deviceAccessCodes/${normalized}`)

  const result = await runTransaction(codeRef, (entry) => {
    if (!entry) return entry            // code vanished — abort, nothing to claim
    if (entry.claimed) return           // already claimed — abort transaction
    entry.claimed   = true
    entry.claimedBy = uid
    entry.claimedAt = Date.now()
    return entry
  })

  if (!result.committed) {
    throw new Error('This device code was just claimed by someone else. Please contact support.')
  }

  // Keep a reverse pointer on the user's own profile too, so the dashboard
  // can show which physical system this account controls.
  await update(dbRef(db, `users/${uid}`), { systemId: result.snapshot.val()?.systemId ?? normalized })
}