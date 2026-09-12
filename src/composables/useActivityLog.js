// src/composables/useActivityLog.js
//
// Shared system log: every action and device event is stored under a single
// fixed Firestore path so the activity feed is visible from any browser/tab
// without any user-account mapping. This matches the no-account architecture.
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
import { checkRateLimit } from '@/security/rateLimiter'

const SYSTEM_LOG_PATH = 'system'
const entriesCollection = () => collection(firestore, 'activity_log', SYSTEM_LOG_PATH, 'entries')

const WRITE_LIMIT_KEY_PREFIX = 'activity-log-write:'
const MAX_WRITES_PER_MINUTE = 20

async function writeEntry(message, color, type, extra = {}) {
  const { allowed, resetAt } = checkRateLimit(`${WRITE_LIMIT_KEY_PREFIX}${SYSTEM_LOG_PATH}`, {
    windowMs: 60 * 1000,
    maxAttempts: MAX_WRITES_PER_MINUTE,
  })

  if (!allowed) {
    console.warn(
      `Activity log write blocked by rate limit for ${SYSTEM_LOG_PATH} — resets in ${Math.ceil((resetAt - Date.now()) / 1000)}s. Entry dropped:`,
      message
    )
    return
  }

  try {
    await addDoc(entriesCollection(), {
      message,
      color,
      type,
      timestamp: Date.now(),
      createdAt: serverTimestamp(),
      ...extra,
    })
  } catch (err) {
    console.error(`Failed to write activity log entry to activity_log/${SYSTEM_LOG_PATH}/entries:`, err)
  }
}

/**
 * Log an action triggered by the system or by a manual control action.
 * The log is shared by the entire system, not scoped to an individual user.
 */
export async function logActivity(message, color = '#94a3b8', type = 'system', extra = {}) {
  await writeEntry(message, color, type, extra)
}

/**
 * Alias kept for compatibility with existing call sites. System-wide logs do
 * not belong to any signed-in user.
 */
export async function logSystemActivity(message, color = '#94a3b8', type = 'system') {
  await writeEntry(message, color, type)
}

/**
 * Live-subscribe to the shared system log, newest first.
 */
export function useActivityFeed(limitCount = 25) {
  const rawEntries = ref([])
  const loaded = ref(false)
  let unsubscribe = null

  function subscribe() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    loaded.value = false

    const q = query(
      entriesCollection(),
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
        console.error(`activity feed listener error on activity_log/${SYSTEM_LOG_PATH}/entries:`, err)
        loaded.value = true
      }
    )
  }

  onMounted(() => subscribe())

  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
  })

  const entries = computed(() => rawEntries.value)

  return { entries, loaded }
}