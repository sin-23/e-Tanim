// src/composables/useNotifications.js
//
// Alerts from RTDB `notifications/{notificationId}`.
//   reservoir_low  - written by the ESP32 when a tank is at or below 30%
//   harvest_ready  - written by the Mini PC when a ripe crop is detected
// The dashboard only reads. "Read" state is per browser (localStorage), since
// clients may not write to this node.
import { ref, computed, onUnmounted } from 'vue'
import { db } from '@/firebase'
import { validateNotificationPayload } from '@/security/validator'

export const MAX_NOTIFICATIONS = 20
const LAST_SEEN_KEY = 'etanim:notifications:lastSeen'
const DISMISSED_KEY = 'etanim:notifications:dismissed'

export const NOTIFICATION_META = {
  reservoir_low: { label: 'Low reservoir', emoji: '🛢️', tone: 'danger' },
  harvest_ready: { label: 'Ready to harvest', emoji: '📷', tone: 'good' },
}

function readLastSeen() {
  try { return Number(localStorage.getItem(LAST_SEEN_KEY)) || 0 } catch { return 0 }
}
function writeLastSeen(ms) {
  try { localStorage.setItem(LAST_SEEN_KEY, String(ms)) } catch { /* storage blocked */ }
}

function readDismissed() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : []
  } catch { return [] }
}
function writeDismissed(ids) {
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids)) } catch { /* storage blocked */ }
}

// Module-level so every component shares one dismissed list.
// Dismissing (X in the bell dropdown) only hides a notification from the bell —
// the Dashboard Alerts list always shows every notification. Stored per browser, like the "read" state.
const dismissedIds = ref(readDismissed())

export function useNotifications() {
  const items = ref([])
  const loading = ref(true)
  const error = ref(null)
  const lastSeen = ref(readLastSeen())
  let unsub = null

  import('firebase/database').then(({ ref: dbRef, query, limitToLast, onValue, off }) => {
    // Push keys are chronological, so limitToLast returns the newest entries.
    const q = query(dbRef(db, 'notifications'), limitToLast(MAX_NOTIFICATIONS))
    const cb = onValue(
      q,
      (snap) => {
        const list = []
        snap.forEach((child) => {
          const res = validateNotificationPayload(child.val())
          if (res.ok) list.push({ id: child.key, ...res.data })
        })
        list.sort((a, b) => b.createdAt - a.createdAt)
        items.value = list
        // Forget dismissed ids that have scrolled out of the newest-N window.
        if (list.length > 0) {
          const live = new Set(list.map(n => n.id))
          const kept = dismissedIds.value.filter(id => live.has(id))
          if (kept.length !== dismissedIds.value.length) {
            dismissedIds.value = kept
            writeDismissed(kept)
          }
        }
        loading.value = false
        error.value = null
      },
      () => {
        loading.value = false
        error.value = 'Connection error.'
      },
    )
    unsub = () => off(q, 'value', cb)
  })

  onUnmounted(() => { if (unsub) unsub() })

  const notifications = computed(() =>
    items.value.map(n => ({
      ...n,
      ...NOTIFICATION_META[n.type],
      unread: n.createdAt > lastSeen.value,
    }))
  )

  const unreadCount = computed(() => notifications.value.filter(n => n.unread).length)

  // Bell view: same list minus anything the user pressed X on.
  const bellNotifications = computed(() =>
    notifications.value.filter(n => !dismissedIds.value.includes(n.id))
  )
  const bellUnreadCount = computed(() => bellNotifications.value.filter(n => n.unread).length)

  function dismiss(id) {
    if (dismissedIds.value.includes(id)) return
    dismissedIds.value = [...dismissedIds.value, id]
    writeDismissed(dismissedIds.value)
  }

  function markAllRead() {
    const newest = items.value.reduce((m, n) => Math.max(m, n.createdAt), 0)
    lastSeen.value = Math.max(newest, Date.now())
    writeLastSeen(lastSeen.value)
  }

  return {
    notifications, unreadCount, loading, error, markAllRead,
    bellNotifications, bellUnreadCount, dismiss,
  }
}