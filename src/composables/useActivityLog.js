// src/composables/useActivityLog.js
//
// activity_log/{uid}/entries/... — private, per-user. Every action a
// specific logged-in user performs (manual toggles, schedule/source/
// threshold edits) plus every device-initiated event on their own system
// (timer auto-off, future AI detections) lives here.
//
// NOTE: this now runs on Firestore, not Realtime Database. Everything
// else in the app (relays, sensors, schedules) stays on RTDB — only the
// activity log moved. Reasoning: RTDB's orderByChild + limitToLast needs
// a published server-side index to stay reliable as new children are
// added, which we never had configured, and was the suspected cause of
// entries getting stuck after the first snapshot. Firestore's
// orderBy + limit queries don't have that failure mode (single-field
// indexes are automatic), and onSnapshot()'s unsubscribe pattern is
// simpler than RTDB's off()/onValue() return-value mismatch that bit us
// earlier. Both databases live in the same Firebase project — see
// src/firebase.js for the shared `firestore` export.
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { firestore } from '@/firebase'
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { currentUser } from '@/auth/useAuth'
import { checkRateLimit } from '@/security/rateLimiter'

const entriesCollection = (uid) => collection(firestore, 'activity_log', uid, 'entries')

// Activity log writes are triggered by real user/device actions (relay
// toggles, schedule edits, auto-off events), so under normal use this
// limit is never hit. It exists to stop runaway writes — e.g. a stuck
// auto-off loop or a buggy retry — from spamming Firestore and racking
// up write costs. This is a client-side guard only; see
// firestore.rules for the server-enforced backstop (schema + field
// validation — true write-rate throttling isn't expressible in
// Firestore rules alone and would need App Check / Cloud Functions).
const WRITE_LIMIT_KEY_PREFIX = 'activity-log-write:'
const MAX_WRITES_PER_MINUTE = 20

async function writeEntry(uid, message, color, type, extra = {}) {
  const { allowed, resetAt } = checkRateLimit(`${WRITE_LIMIT_KEY_PREFIX}${uid}`, {
    windowMs: 60 * 1000,
    maxAttempts: MAX_WRITES_PER_MINUTE,
  })
  if (!allowed) {
    console.warn(
      `Activity log write blocked by rate limit for ${uid} — resets in ${Math.ceil((resetAt - Date.now()) / 1000)}s. Entry dropped:`,
      message
    )
    return
  }

  try {
    await addDoc(entriesCollection(uid), {
      message,
      color,
      type,
      timestamp: Date.now(),        // used for client-side sort/display
      createdAt: serverTimestamp(), // authoritative server time, for auditing
      ...extra,
    })
  } catch (err) {
    console.error(`Failed to write activity log entry to activity_log/${uid}/entries:`, err)
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
  await writeEntry(user.uid, message, color, type, {
    by: user.displayName || user.email || 'Unknown user',
  })
}

/**
 * Log a device-initiated event (timer auto-off, AI detection) tied to the
 * currently signed-in user's own system. Same collection as logActivity(),
 * just without a "by" tag since no one specifically clicked anything.
 */
export async function logSystemActivity(message, color = '#94a3b8', type = 'system') {
  const user = currentUser.value
  if (!user) {
    console.warn('logSystemActivity() called with no signed-in user — entry not saved:', message)
    return
  }
  await writeEntry(user.uid, message, color, type)
}

/**
 * Live-subscribe to the current user's log entries, newest first.
 * Re-subscribes on login/logout so switching accounts never leaks the
 * previous user's entries.
 */
export function useActivityFeed(limitCount = 25) {
  const rawEntries = ref([])
  const loaded = ref(false)
  let unsubscribe = null
  let subscribedUid = null

  function subscribe(uid) {
    if (subscribedUid === uid) return
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    subscribedUid = uid
    loaded.value = false

    if (!uid) {
      rawEntries.value = []
      loaded.value = true
      return
    }

    const q = query(
      entriesCollection(uid),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        rawEntries.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        loaded.value = true
      },
      (err) => {
        console.error(`activity feed listener error on activity_log/${uid}/entries:`, err)
        loaded.value = true // stop showing a loading state on error too — don't spin forever
      }
    )
  }

  onMounted(() => {
    subscribe(currentUser.value ? currentUser.value.uid : null)
  })

  const stopWatch = watch(
    () => currentUser.value?.uid ?? null,
    (uid) => subscribe(uid)
  )

  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
    stopWatch()
  })

  // Firestore already returns newest-first sorted + capped at limitCount,
  // so no extra client-side sort/slice needed — computed just passes it
  // through for a stable, consistent return shape.
  const entries = computed(() => rawEntries.value)

  return { entries, loaded }
}