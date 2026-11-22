// src/composables/useMiniPcStatus.js
//
// The Mini PC AI Inference heartbeat, `status/miniPc/lastCycleAt` (decision log item 44).
// One listener for the whole app, shared by the top nav bar, the Crop Monitor and the
// Snapshot viewer. It starts when the account's systemId is known and stops when it is
// cleared (sign-out). The Mini PC counts as down after 1 hour without a heartbeat.
import { ref, computed, watch } from 'vue'
import { db } from '@/firebase'
import { systemId, sysPath } from '@/composables/useSystemId'

const HEARTBEAT_STALE_MS = 60 * 60 * 1000

const lastCycleAt = ref(null)
const loaded = ref(false)
const now = ref(Date.now())

let started = false
let stopListening = null

function reset() {
  if (stopListening) { stopListening(); stopListening = null }
  lastCycleAt.value = null
  loaded.value = false
}

function start() {
  if (started) return
  started = true
  setInterval(() => { now.value = Date.now() }, 30000)

  watch(systemId, (id) => {
    reset()
    if (!id) return
    import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
      if (systemId.value !== id) return           // changed while the module loaded
      const r = dbRef(db, sysPath('status/miniPc/lastCycleAt'))
      const cb = onValue(
        r,
        (snap) => {
          const v = snap.val()
          lastCycleAt.value = typeof v === 'number' && v > 0 ? v : null
          loaded.value = true
        },
        () => { loaded.value = true },
      )
      stopListening = () => off(r, 'value', cb)
    })
  }, { immediate: true })
}

export function useMiniPcStatus() {
  start()
  const miniPc = computed(() => ({
    loaded: loaded.value,
    lastCycleAt: lastCycleAt.value,
    online: lastCycleAt.value !== null && now.value - lastCycleAt.value <= HEARTBEAT_STALE_MS,
  }))
  return { miniPc }
}