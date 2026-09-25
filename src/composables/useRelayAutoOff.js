// src/composables/useRelayAutoOff.js
//
// RelayControl.vue's own countdown only runs while that specific component
// is mounted (i.e. only while you're on the Irrigation page). Navigate away
// — to the Dashboard, for example — and that component unmounts, killing its
// timer. Nothing is then left running to actually write `relay = false` when
// the countdown reaches zero, so the relay stays ON in Firebase past its
// intended shutoff time until someone reopens the Irrigation page.
//
// This watcher lives at the app root (mounted once from App.vue) so it keeps
// enforcing the `*_off_at` deadlines regardless of which route is active, as
// long as the browser tab stays open. It's the single source of truth for
// actually turning relays off; RelayControl.vue's local countdown is only
// there to render a live "MM:SS" display for whoever is looking at it.
import { ref as dbRef, onValue, get, update, runTransaction } from 'firebase/database'
import { db } from '@/firebase'
import { logSystemActivity } from './useActivityLog'

const RELAY_PATHS = [
  'control/relay_lowland',
  'control/relay_highland',
  'control/relay_fert',
  'control/relay_mist',
]
const RELAY_LABELS = {
  'control/relay_lowland':  'Lowland irrigation',
  'control/relay_highland': 'Highland irrigation',
  'control/relay_fert':     'Fertilizer pump',
  'control/relay_mist':     'Highland misting',
}

let started = false

/**
 * Turn a timed relay off because its timer expired, and log it exactly once.
 * Both this watcher and RelayControl's countdown can reach zero at nearly the
 * same moment (or in two tabs); the transaction only commits for whichever
 * caller actually flips the relay from ON to OFF, so only that caller logs.
 * Returns true if this call turned the relay off.
 */
export async function expireRelay(path) {
  const offAtPath = `${path}_off_at`
  try {
    const result = await runTransaction(dbRef(db, path), (current) =>
      current === false ? undefined : false   // abort if it is already known to be off
    )
    if (!result.committed) return false
    await update(dbRef(db), { [offAtPath]: null })
    logSystemActivity(`${RELAY_LABELS[path] ?? path} auto-off — timer expired`, '#94a3b8', 'relay')
    return true
  } catch (err) {
    console.error(`Relay auto-off: failed to turn off ${path}:`, err)
    return false
  }
}

async function turnOffExpiredRelay(path) {
  try {
    await expireRelay(path)
  } catch (err) {
    // Most likely a permission error because the user isn't authenticated
    // yet — harmless, the watcher will re-evaluate on the next relay change.
    console.error(`Relay auto-off watcher: failed to turn off ${path}:`, err)
  }
}

function watchRelay(path) {
  const offAtPath = `${path}_off_at`
  let expiryTimer = null

  onValue(dbRef(db, path), async (snapshot) => {
    if (expiryTimer) {
      clearTimeout(expiryTimer)
      expiryTimer = null
    }

    const isOn = snapshot.val() === true
    if (!isOn) return

    try {
      const offAtSnap = await get(dbRef(db, offAtPath))
      const offAt = offAtSnap.exists() ? offAtSnap.val() : null
      if (typeof offAt !== 'number') return // no timed shutoff scheduled for this relay

      const remainingMs = offAt - Date.now()
      if (remainingMs <= 0) {
        await turnOffExpiredRelay(path)
      } else {
        expiryTimer = setTimeout(() => turnOffExpiredRelay(path), remainingMs)
      }
    } catch (err) {
      console.error(`Relay auto-off watcher: failed to read ${offAtPath}:`, err)
    }
  })
}

// Call once (e.g. from App.vue after the user is authenticated). Safe to
// call multiple times — only the first call actually attaches listeners.
export function startRelayAutoOffWatcher() {
  if (started) return
  started = true
  RELAY_PATHS.forEach(watchRelay)
}