// src/composables/useNotifications.js
//
// Alerts from RTDB `notifications/{notificationId}`.
//   reservoir_low  - written by the ESP32 when a tank is at or below 30%
//   harvest_ready  - written by the Mini PC when a ripe crop is detected
//   harvest_check  - written by the Mini PC one hour after the user marked a
//                    fruit harvested and it was seen again (carries crop,
//                    fruitId and the fruit's harvestedAt)
// Notifications are read-only for clients, except that members may resolve a
// harvest_check with three fields: resolution, resolvedBy, resolvedAt. The
// resolution is shared across accounts and stays in the list as a record
// (decision log item 51). "Read" state is per browser (localStorage).
import { sysPath } from '@/composables/useSystemId'
import { ref, computed, watch, onUnmounted } from 'vue'
import { ref as dbRef, onValue as onDbValue, off as offDb, update as dbUpdate } from 'firebase/database'
import { db } from '@/firebase'
import { currentUser } from '@/auth/useAuth'
import { validateNotificationPayload } from '@/security/validator'
import { PRESUMED_HARVESTED_MS } from '@/composables/useDetections'

export const MAX_NOTIFICATIONS = 20
const LAST_SEEN_KEY = 'etanim:notifications:lastSeen'
const DISMISSED_KEY = 'etanim:notifications:dismissed'

export const NOTIFICATION_META = {
  reservoir_low: { label: 'Low reservoir', emoji: '🛢️', tone: 'danger' },
  harvest_ready: { label: 'Ready to harvest', emoji: '📷', tone: 'good' },
  harvest_check: { label: 'Harvest check', emoji: '🔎', tone: 'warn' },
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
  const now = ref(Date.now())
  const busyId = ref(null)   // id of the notification being resolved or undone
  let unsub = null
  const nowTimer = setInterval(() => { now.value = Date.now() }, 30000)

  // Current state of the fruit behind each harvest_check, keyed 'crop/fruitId'.
  // Needed to decide whether Undo is still allowed. null = no such fruit.
  const fruitStates = ref({})
  const fruitUnsubs = new Map()
  const fruitKey = (n) => (n.crop && n.fruitId ? `${n.crop}/${n.fruitId}` : null)

  watch(
    () => items.value.filter(n => n.type === 'harvest_check' && fruitKey(n)).map(fruitKey).sort().join('|'),
    (joined) => {
      const wanted = new Set(joined ? joined.split('|') : [])
      for (const [key, off] of fruitUnsubs) {
        if (!wanted.has(key)) { off(); fruitUnsubs.delete(key) }
      }
      for (const key of wanted) {
        if (fruitUnsubs.has(key)) continue
        const r = dbRef(db, sysPath(`detections/${key}`))
        const cb = onDbValue(
          r,
          (snap) => {
            const v = snap.val()
            fruitStates.value = {
              ...fruitStates.value,
              [key]: v && typeof v === 'object'
                ? { harvested: v.harvested === true, harvestedAt: v.harvestedAt ?? null, updatedAt: typeof v.updatedAt === 'number' ? v.updatedAt : 0 }
                : null,
            }
          },
          () => { fruitStates.value = { ...fruitStates.value, [key]: null } },
        )
        fruitUnsubs.set(key, () => offDb(r, 'value', cb))
      }
    },
    { immediate: true },
  )

  import('firebase/database').then(({ ref: dbRef, query, limitToLast, onValue, off }) => {
    // Push keys are chronological, so limitToLast returns the newest entries.
    const q = query(dbRef(db, sysPath('notifications')), limitToLast(MAX_NOTIFICATIONS))
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

  onUnmounted(() => {
    if (unsub) unsub()
    clearInterval(nowTimer)
    for (const off of fruitUnsubs.values()) off()
    fruitUnsubs.clear()
  })

  // Undo stays available until the fruit's state changes again (item 51):
  //   not_harvested -> until the fruit is marked harvested again or not seen for 48 hours
  //   dismissed     -> until the fruit is no longer marked harvested with that same time
  function undoAllowed(n) {
    if (!n.resolution) return false
    const key = fruitKey(n)
    if (!key) return n.resolution === 'dismissed'   // nothing on the fruit to restore
    const f = fruitStates.value[key]
    if (!f) return false
    if (n.resolution === 'not_harvested') {
      return !f.harvested && now.value - f.updatedAt <= PRESUMED_HARVESTED_MS
    }
    return f.harvested && (n.harvestedAt === undefined || f.harvestedAt === n.harvestedAt)
  }

  // A resolved check is a record of what someone decided at that time. If the
  // fruit has changed since, say so, so the alert and the Crop Monitor never
  // seem to contradict each other.
  function currentNote(n) {
    if (!n.resolution) return null
    const key = fruitKey(n)
    const f = key ? fruitStates.value[key] : null
    if (!f) return null
    if (n.resolution === 'not_harvested') {
      if (f.harvested) return 'Since then, the fruit was marked harvested again.'
      if (now.value - f.updatedAt > PRESUMED_HARVESTED_MS) return 'Since then, the fruit has not been seen for 48 hours (presumed harvested).'
      return null
    }
    if (!f.harvested) return 'Since then, the fruit was marked as not harvested.'
    return null
  }

  const notifications = computed(() =>
    items.value.map(n => ({
      ...n,
      ...NOTIFICATION_META[n.type],
      unread: n.createdAt > lastSeen.value,
      resolved: !!n.resolution,
      canUndo: undoAllowed(n),
      currentNote: currentNote(n),
    }))
  )

  // The open (unresolved) harvest check for one fruit, if any.
  function openCheckFor(cropId, fruitId) {
    return notifications.value.find(n =>
      n.type === 'harvest_check' && !n.resolution && n.crop === cropId && n.fruitId === fruitId
    ) || null
  }

  function actorName() {
    const u = currentUser.value
    return (u ? (u.displayName || u.email || 'Unknown user') : 'Unknown user').slice(0, 100)
  }

  // One atomic multi-path update, so a notification never says "not harvested"
  // while the fruit is still marked harvested.
  async function resolveCheck(n, resolution) {
    busyId.value = n.id
    try {
      const updates = {
        [sysPath(`notifications/${n.id}/resolution`)]: resolution,
        [sysPath(`notifications/${n.id}/resolvedBy`)]: actorName(),
        [sysPath(`notifications/${n.id}/resolvedAt`)]: Date.now(),
      }
      if (resolution === 'not_harvested') {
        if (!n.crop || !n.fruitId) return false
        updates[sysPath(`detections/${n.crop}/${n.fruitId}/harvested`)] = null
        updates[sysPath(`detections/${n.crop}/${n.fruitId}/harvestedAt`)] = null
      }
      await dbUpdate(dbRef(db), updates)
      return true
    } catch (err) {
      console.error('Could not resolve the harvest check:', err)
      return false
    } finally {
      busyId.value = null
    }
  }

  // Undo clears the three fields. After "not harvested" it also puts back the
  // ORIGINAL harvestedAt (not a new time), so the Mini PC does not send a
  // second check an hour later.
  async function undoResolution(n) {
    if (!undoAllowed(n)) return false
    busyId.value = n.id
    try {
      const updates = {
        [sysPath(`notifications/${n.id}/resolution`)]: null,
        [sysPath(`notifications/${n.id}/resolvedBy`)]: null,
        [sysPath(`notifications/${n.id}/resolvedAt`)]: null,
      }
      if (n.resolution === 'not_harvested') {
        // Fallback when the notification has no harvestedAt: the check is written one hour after it.
        const original = n.harvestedAt ?? (n.createdAt - 60 * 60 * 1000)
        updates[sysPath(`detections/${n.crop}/${n.fruitId}/harvested`)] = true
        updates[sysPath(`detections/${n.crop}/${n.fruitId}/harvestedAt`)] = original
      }
      await dbUpdate(dbRef(db), updates)
      return true
    } catch (err) {
      console.error('Could not undo the resolution:', err)
      return false
    } finally {
      busyId.value = null
    }
  }

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
    openCheckFor, resolveCheck, undoResolution, busyId,
  }
}