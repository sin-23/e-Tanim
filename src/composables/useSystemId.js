// src/composables/useSystemId.js
// The unit this account belongs to. Everything except users and deviceAccessCodes
// lives under systems/{systemId}/ (decision log item 50).
import { ref } from 'vue'
import { db } from '@/firebase'
import { ref as dbRef, get } from 'firebase/database'

export const systemId = ref(null)

export function setSystemId(id) {
  systemId.value = typeof id === 'string' && id ? id : null
}

/** Read users/{uid}/systemId once after sign-in. */
export async function loadSystemId(uid) {
  try {
    const snap = await get(dbRef(db, `users/${uid}/systemId`))
    setSystemId(snap.val())
  } catch {
    setSystemId(null)
  }
}

/** Path under the system, for the Realtime Database. */
export function sysPath(rel) {
  if (!systemId.value) throw new Error('Not joined to a unit yet.')
  return `systems/${systemId.value}/${rel}`
}