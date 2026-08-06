// src/auth/useDeviceAccessCode.js
//
// Looks up and joins "device access codes" — short codes printed as a QR
// code (and as plain text) on each physical e-Tanim unit. A code must be
// verified here before RegisterView unlocks the account-creation form.
//
// A code is a reusable JOIN code, not single-use — multiple accounts (e.g.
// a household) can register against the same code, the way several family
// members might all get added to one shared garden. Every account that
// joins is added under deviceAccessCodes/{code}/members, and the code
// itself stays valid unless an admin sets its "active" flag to false.
//
// IMPORTANT — read this before relying on it in production:
// This is a client-side UX gate, not a hard security boundary. The lookup
// happens BEFORE the user is authenticated, so per Firebase RTDB rules it
// has to be a public read (see database.rules.json: "deviceAccessCodes").
// A technically determined person could still read the codes list directly
// via the Firebase REST API and register without ever opening the app.
// Treat this the same way you'd treat a family Wi-Fi password: it keeps out
// casual/opportunistic sign-ups, not a motivated attacker. For a hard
// guarantee (e.g. once this goes past a class prototype), move validation
// into a Cloud Function that mints a custom token only for a valid, active
// code, and stop exposing the codes list to unauthenticated reads.

import { db } from '@/firebase'
import { ref as dbRef, get, update } from 'firebase/database'

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
 * Checks whether a device access code exists and is still active.
 * Read-only — does NOT add the caller as a member yet. Joining happens
 * after the account is actually created (see joinDeviceBySystemCode) so
 * nothing is written if the user backs out of the registration form.
 *
 * @returns {Promise<{ ok: true, systemId: string, code: string } | { ok: false, error: string }>}
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
  if (entry.active === false) {
    return { ok: false, error: 'This device code has been deactivated. Ask the system owner for a new one.' }
  }

  return { ok: true, systemId: entry.systemId ?? normalized, code: normalized }
}

/**
 * Adds a newly-created user as a member of the system tied to this code.
 * Called right after createUserWithEmailAndPassword()/signInWithPopup()
 * succeeds, once the caller is authenticated (RTDB rules require a user
 * to write only their own uid under members). Codes are reusable, so this
 * can be called by any number of accounts (e.g. a whole family) without
 * locking anyone else out.
 */
export async function joinDeviceBySystemCode(code, uid) {
  const normalized = normalizeCode(code)
  const codeSnap = await get(dbRef(db, `deviceAccessCodes/${normalized}`))

  if (!codeSnap.exists()) {
    throw new Error('This device code no longer exists. Please contact support.')
  }
  const entry = codeSnap.val()
  if (entry.active === false) {
    throw new Error('This device code has been deactivated.')
  }

  const systemId = entry.systemId ?? normalized

  await Promise.all([
    // Add this account to the system's member list.
    update(dbRef(db, `deviceAccessCodes/${normalized}/members`), { [uid]: true }),
    // Keep a reverse pointer on the user's own profile, so the dashboard
    // knows which physical system this account controls.
    update(dbRef(db, `users/${uid}`), { systemId }),
  ])
}

// Kept as an alias so any older import of claimDeviceAccessCode still works.
export const claimDeviceAccessCode = joinDeviceBySystemCode