// src/composables/useActivityLog.js
//
// Two separate log streams, so that one user's actions are never visible to
// another user:
//
//   activity_log/users/{uid}/...  — private, per-user. Manual pump toggles,
//                                    schedule edits, source switches, and
//                                    threshold changes a specific logged-in
//                                    user performed. Only that uid may read
//                                    or write their own branch.
//
//   activity_log/system/...       — public, unattributed. Events nobody
//                                    specifically triggered by logging in —
//                                    a timer expiring on its own, or (once
//                                    implemented) the AI detection device.
//                                    Readable/writable without auth, since
//                                    the detection device isn't a Firebase
//                                    Auth user and this should still be
//                                    visible while logged out.
//
// logActivity()       -> writes to the current user's private branch.
//                         No-ops (with a console warning) if nobody is
//                         signed in, since a private entry needs an owner.
// logSystemActivity()  -> writes to the shared public branch.
// useActivityFeed()   -> merges "my private entries" (if signed in) with
//                         the public system entries into one reactive,
//                         newest-first list.
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { db } from '@/firebase'
import {
  ref as dbRef, push, set, onValue, off,
  query, orderByChild, limitToLast,
} from 'firebase/database'
import { currentUser } from '@/auth/useAuth'

const SYSTEM_PATH = 'activity_log/system'
const userPath = (uid) => `activity_log/users/${uid}`

async function writeEntry(path, message, color, type, extra = {}) {
  try {
    const entryRef = push(dbRef(db, path))
    await set(entryRef, {
      message,
      color,
      type,
      timestamp: Date.now(),
      ...extra,
    })
  } catch (err) {
    // Never let logging failures break the actual feature (relay control,
    // schedule saving, etc.) that triggered the log call.
    console.error(`Failed to write activity log entry to ${path}:`, err)
  }
}

/**
 * Log an action a specific signed-in user performed. Private to that user.
 * @param {string} message - e.g. "Water pump manually turned ON"
 * @param {string} color   - hex color for the log dot/badge
 * @param {string} type    - category, e.g. 'relay' | 'schedule' | 'source' | 'threshold'
 */
export async function logActivity(message, color = '#94a3b8', type = 'system') {
  const user = currentUser.value
  if (!user) {
    console.warn('logActivity() called with no signed-in user — entry not saved:', message)
    return
  }
  await writeEntry(userPath(user.uid), message, color, type, {
    by: user.displayName || user.email || 'Unknown user',
  })
}

/**
 * Log a system/device event nobody specifically triggered — auto-off timers,
 * AI detections, etc. Public: visible to everyone, including logged-out users.
 */
export async function logSystemActivity(message, color = '#94a3b8', type = 'system') {
  await writeEntry(SYSTEM_PATH, message, color, type)
}

/**
 * Live-subscribe to the current user's private log entries merged with the
 * public system log, newest first. Re-evaluates automatically on login/logout
 * so switching accounts never leaks the previous user's private entries.
 */
export function useActivityFeed(limit = 25) {
  const systemEntries = ref([])
  const userEntries    = ref([])
  let unsubSystem = null
  let unsubUser   = null

  function subscribeSystem() {
    if (unsubSystem) return
    const q = query(dbRef(db, SYSTEM_PATH), orderByChild('timestamp'), limitToLast(limit))
    const handler = onValue(q, (snapshot) => {
      const list = []
      snapshot.forEach((child) => list.push({ id: child.key, ...child.val() }))
      systemEntries.value = list
    })
    unsubSystem = () => off(q, 'value', handler)
  }

  function subscribeUser(uid) {
    unsubscribeUser()
    const q = query(dbRef(db, userPath(uid)), orderByChild('timestamp'), limitToLast(limit))
    const handler = onValue(q, (snapshot) => {
      const list = []
      snapshot.forEach((child) => list.push({ id: child.key, ...child.val() }))
      userEntries.value = list
    })
    unsubUser = () => off(q, 'value', handler)
  }

  function unsubscribeUser() {
    if (unsubUser) { unsubUser(); unsubUser = null }
    userEntries.value = []
  }

  onMounted(() => {
    subscribeSystem()
    if (currentUser.value) subscribeUser(currentUser.value.uid)
  })

  // Re-subscribe to the private branch whenever the signed-in user changes,
  // so logging out (or switching accounts) immediately drops the previous
  // user's private entries instead of leaving them visible.
  const stopWatch = watch(currentUser, (user) => {
    if (user) {
      subscribeUser(user.uid)
    } else {
      unsubscribeUser()
    }
  })

  onUnmounted(() => {
    if (unsubSystem) unsubSystem()
    unsubscribeUser()
    stopWatch()
  })

  const entries = computed(() =>
    [...userEntries.value, ...systemEntries.value]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  )

  return { entries }
}