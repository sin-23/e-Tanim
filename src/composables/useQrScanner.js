// src/composables/useQrScanner.js
//
// Wraps getUserMedia + jsQR into a small reusable "point camera at a QR
// code, get the decoded string back" composable. No UI here — see
// DeviceAccessGate.vue for the scan screen that uses this.

import { ref, shallowRef, onBeforeUnmount } from 'vue'
import jsQR from 'jsqr'

export function useQrScanner() {
  const isScanning   = ref(false)
  const errorMsg     = ref('')
  const videoEl      = shallowRef(null) // set by the component via bindVideo()
  const decodedValue = ref('')

  let stream       = null
  let canvas        = null
  let ctx           = null
  let rafId         = null

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

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
    } catch (err) {
      errorMsg.value = friendlyCameraError(err)
      return
    }

    if (!videoEl.value) {
      stop()
      return
    }

    videoEl.value.srcObject = stream
    await videoEl.value.play()

    canvas = document.createElement('canvas')
    ctx    = canvas.getContext('2d', { willReadFrequently: true })

    isScanning.value = true
    tick()
  }

  function tick() {
    if (!isScanning.value) return

    const video = videoEl.value
    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const frame  = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(frame.data, frame.width, frame.height, {
        inversionAttempts: 'dontInvert',
      })

      if (result?.data) {
        decodedValue.value = result.data.trim()
        stop()
        return
      }
    }

    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    isScanning.value = false
    if (rafId) { cancelAnimationFrame(rafId); rafId = null }
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      stream = null
    }
    if (videoEl.value) videoEl.value.srcObject = null
  }

  onBeforeUnmount(stop)

  return { isScanning, errorMsg, decodedValue, bindVideo, start, stop }
}