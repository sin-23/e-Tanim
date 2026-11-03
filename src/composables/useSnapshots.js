// src/composables/useSnapshots.js
//
// Snapshots are the cropped fruit images of decision log item 45. Nothing here
// runs until the user opens a snapshot: list views never load images.
//
//   loadSnapshotUrl(framePath)      Storage download URL, or a reason it is missing
//   useFrameRequests()              live view of frame_requests (members only)
//   requestSnapshot(entryContext)   creates frame_requests/{id}
//
// framePath is the part under the system (frames/{crop}/{file}); the system
// prefix is added here, the same way sysPath() does for the database.
import { ref, onUnmounted } from 'vue'
import { db, storage } from '@/firebase'
import { sysPath, systemId } from '@/composables/useSystemId'

// Provisional (checklist 13.8). A request older than this counts as timed out.
export const REQUEST_TIMEOUT_MS = 15 * 60 * 1000

/**
 * @returns {Promise<{ status: 'loaded', url: string } | { status: 'missing' | 'unavailable' | 'error' }>}
 *  missing     the file is not in the cloud (never uploaded, or removed by the cleanup)
 *  unavailable Storage is not set up, or the account has no unit
 *  error       any other failure
 */
export async function loadSnapshotUrl(framePath) {
  if (!storage || !systemId.value) return { status: 'unavailable' }
  try {
    const { ref: stRef, getDownloadURL } = await import('firebase/storage')
    const url = await getDownloadURL(stRef(storage, `systems/${systemId.value}/${framePath}`))
    return { status: 'loaded', url }
  } catch (err) {
    if (err?.code === 'storage/object-not-found') return { status: 'missing' }
    console.error('Could not load the snapshot:', err)
    return { status: 'error' }
  }
}

/**
 * Live list of open requests, keyed by framePath. The Mini PC deletes a request
 * once the image is uploaded, so anything here is still waiting.
 */
export function useFrameRequests() {
  const byPath = ref({})
  const loaded = ref(false)
  let stop = () => {}

  import('firebase/database').then(({ ref: dbRef, onValue, off }) => {
    const r = dbRef(db, sysPath('frame_requests'))
    const cb = onValue(
      r,
      (snap) => {
        const map = {}
        const raw = snap.val()
        if (raw && typeof raw === 'object') {
          for (const [id, rec] of Object.entries(raw)) {
            if (!rec || typeof rec.framePath !== 'string' || typeof rec.requestedAt !== 'number') continue
            // keep the newest request per image
            if (!map[rec.framePath] || map[rec.framePath].requestedAt < rec.requestedAt) {
              map[rec.framePath] = { id, requestedAt: rec.requestedAt }
            }
          }
        }
        byPath.value = map
        loaded.value = true
      },
      () => { loaded.value = true },
    )
    stop = () => off(r, 'value', cb)
  })

  onUnmounted(() => stop())
  return { requestsByPath: byPath, requestsLoaded: loaded }
}

/** Create a request. Returns true when it was written. */
export async function requestSnapshot({ crop, fruitId, entryId, framePath }) {
  try {
    const { ref: dbRef, push } = await import('firebase/database')
    await push(dbRef(db, sysPath('frame_requests')), {
      crop, fruitId, entryId, framePath, requestedAt: Date.now(),
    })
    return true
  } catch (err) {
    console.error('Could not request the snapshot:', err)
    return false
  }
}

/** Derived label for an entry: entries carry no type field (item 52). */
export function entryLabel(entries, index) {
  if (index === 0) return 'First sighting'
  return entries[index].stage !== entries[index - 1].stage ? 'Stage change' : 'Ripe reminder'
}