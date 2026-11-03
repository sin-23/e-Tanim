// src/composables/useQrScanner.js
//
// Wraps getUserMedia + zxing-wasm into a small reusable "point camera at a QR
// code, get the decoded string back" composable. No UI here — see
// DeviceAccessGate.vue for the scan screen that uses this.
//
// zxing-wasm (the C++ ZXing reader compiled to WebAssembly) replaces jsQR: it
// handles blur, rotation, perspective and light-on-dark codes much better and
// is faster per frame. The .wasm file is bundled into the build (the project
// builds a single HTML file), so nothing is fetched from a CDN.

import { ref, shallowRef, onBeforeUnmount } from 'vue'
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'

// How long to look before giving up.
const NO_CODE_TIMEOUT_MS = 15000
// Frames wider than this are shrunk before decoding (720p is plenty).
const MAX_DECODE_WIDTH = 1280

let readerPromise = null
function loadReader() {
  if (!readerPromise) {
    readerPromise = import('zxing-wasm/reader').then(async (mod) => {
      mod.setZXingModuleOverrides({
        locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path),
      })
      return mod.readBarcodes
    })
    readerPromise.catch(() => { readerPromise = null })
  }
  return readerPromise
}

export function useQrScanner() {
  const isScanning   = ref(false)
  const errorMsg     = ref('')
  const videoEl      = shallowRef(null) // set by the component via bindVideo()
  const decodedValue = ref('')
  // Corners of the last QR code found, in video pixels, so the UI can outline it.
  const box          = ref(null) // { points: [{x,y}×4], vw, vh }

  let stream       = null
  let canvas        = null
  let ctx           = null
  let rafId         = null
  let timeoutId     = null
  let readBarcodes  = null
  let busy          = false
  let locked        = false

  function bindVideo(el) {
    videoEl.value = el
  }

  function friendlyCameraError(err) {
    if (err?.name === 'NotAllowedError') return 'Camera access was denied. Allow camera access or enter the code manually.'
    if (err?.name === 'NotFoundError')   return 'No camera found on this device. Enter the code manually instead.'
    if (err?.name === 'NotReadableError') return 'Camera is already in use by another app.'
    return 'Could not access the camera. Enter the code manually instead.'
  }

  async function start() {
    if (isScanning.value) return
    errorMsg.value     = ''
    decodedValue.value = ''
    box.value          = null

    if (!navigator.mediaDevices?.getUserMedia) {
      errorMsg.value = 'Camera is not available here (it needs https). Enter the code manually instead.'
      return
    }

    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width:  { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch (err) {
        if (err?.name === 'NotAllowedError' || err?.name === 'NotReadableError') throw err
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }
    } catch (err) {
      errorMsg.value = friendlyCameraError(err)
      return
    }

    if (!videoEl.value) {
      stop()
      return
    }

    videoEl.value.srcObject = stream
    try {
      await videoEl.value.play()
    } catch {
      errorMsg.value = 'Could not start the camera preview. Enter the code manually instead.'
      stop()
      return
    }

    try {
      readBarcodes = await loadReader()
    } catch {
      errorMsg.value = 'Could not load the QR reader. Enter the code manually instead.'
      stop()
      return
    }

    canvas = document.createElement('canvas')
    ctx    = canvas.getContext('2d', { willReadFrequently: true })

    busy   = false
    locked = false
    isScanning.value = true

    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      if (!isScanning.value) return
      stop()
      errorMsg.value = 'No QR code found. Hold the code steady, use good light, or enter the code manually.'
    }, NO_CODE_TIMEOUT_MS)

    tick()
  }

  // Show the outline for a moment so the user sees the code was picked up,
  // then stop the camera and hand the value over.
  function found(value, points, vw, vh) {
    if (!isScanning.value) return
    if (points?.length === 4) box.value = { points, vw, vh }
    clearTimeout(timeoutId); timeoutId = null
    if (rafId) { cancelAnimationFrame(rafId); rafId = null }
    locked = true
    setTimeout(() => {
      locked = false
      if (!stream) return
      decodedValue.value = String(value).trim()
      stop()
    }, 450)
  }

  async function tick() {
    if (!isScanning.value || locked) return

    const video = videoEl.value
    if (video && video.readyState === video.HAVE_ENOUGH_DATA && !busy) {
      busy = true
      try {
        const scale = Math.min(1, MAX_DECODE_WIDTH / video.videoWidth)
        const w = Math.round(video.videoWidth * scale)
        const h = Math.round(video.videoHeight * scale)
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
        ctx.drawImage(video, 0, 0, w, h)

        const frame   = ctx.getImageData(0, 0, w, h)
        const results = await readBarcodes(frame, {
          formats: ['QRCode'],
          tryHarder: true,
          tryInvert: true,
          tryDownscale: true,
          maxNumberOfSymbols: 1,
        })
        const hit = results.find(r => r.isValid && r.text)
        if (hit) {
          const p = hit.position
          const pts = [p.topLeft, p.topRight, p.bottomRight, p.bottomLeft]
            .map(c => ({ x: c.x / scale, y: c.y / scale }))
          found(hit.text, pts, video.videoWidth, video.videoHeight)
          return
        }
      } catch {
        // A failed frame is not fatal; try the next one.
      } finally {
        busy = false
      }
    }

    if (isScanning.value && !locked) rafId = requestAnimationFrame(tick)
  }

  function stop() {
    isScanning.value = false
    locked = false
    box.value = null   // the outline goes away the moment the camera stops
    clearTimeout(timeoutId); timeoutId = null
    if (rafId) { cancelAnimationFrame(rafId); rafId = null }
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      stream = null
    }
    if (videoEl.value) videoEl.value.srcObject = null
  }

  onBeforeUnmount(stop)

  return { isScanning, errorMsg, decodedValue, box, bindVideo, start, stop }
}