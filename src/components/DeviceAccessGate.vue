<template>
  <div class="w-full max-w-sm">
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-garden-text mb-1.5">Verify Your System</h2>
      <p class="text-sm font-medium text-garden-dim">
        Scan the QR code on your e-Tanim unit to create an account for it.
      </p>
    </div>

    <!-- ── Camera scan panel ─────────────────────────────────────────── -->
    <div v-if="mode === 'scan'" class="rounded-2xl border border-garden-border bg-garden-surface p-4">
      <div class="relative w-full aspect-square rounded-xl overflow-hidden bg-garden-void">
        <video ref="videoRef" class="w-full h-full object-cover" playsinline muted />

        <!-- Viewfinder frame -->
        <div class="pointer-events-none absolute inset-6 border-2 border-white/70 rounded-xl" />

        <div v-if="!scanner.isScanning.value" class="absolute inset-0 flex items-center justify-center bg-garden-void/80">
          <button
            class="px-4 py-2 rounded-xl bg-garden-primary text-white text-sm font-semibold hover:bg-[#246040] transition-colors"
            @click="beginScan"
          >
            Start Camera
          </button>
        </div>

        <div v-else class="absolute bottom-3 left-0 right-0 flex justify-center">
          <span class="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-garden-void/70 text-white flex items-center gap-1.5">
            <svg class="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Scanning…
          </span>
        </div>
      </div>

      <p v-if="scanner.errorMsg.value" class="mt-3 text-xs font-semibold text-garden-danger">
        {{ scanner.errorMsg.value }}
      </p>

      <button
        class="w-full mt-4 text-xs font-semibold text-garden-primary hover:underline underline-offset-2"
        @click="mode = 'manual'"
      >
        Don't have a camera? Enter the code manually →
      </button>
    </div>

    <!-- ── Manual code entry panel ───────────────────────────────────── -->
    <div v-else class="rounded-2xl border border-garden-border bg-garden-surface p-5">
      <label class="block text-xs font-medium text-garden-text mb-1.5">Device Access Code</label>
      <input
        v-model="manualCode"
        type="text"
        placeholder="e.g. ET-7F3K2Q"
        maxlength="16"
        class="w-full px-4 py-3 rounded-xl border border-garden-border bg-garden-base text-sm font-semibold
               text-garden-text placeholder:text-garden-dim/50 focus:outline-none focus:border-garden-primary
               focus:ring-2 focus:ring-[#2d7a4f]/15 transition-all uppercase tracking-wider"
        @keydown.enter="submitManual"
      />
      <p class="mt-1.5 text-[11px] text-garden-dim">
        Printed on the label next to the QR code on your e-Tanim enclosure.
      </p>

      <button
        class="w-full mt-4 py-2.5 rounded-xl bg-garden-primary text-white font-medium text-sm
               hover:bg-[#246040] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="!manualCode || checking"
        @click="submitManual"
      >
        {{ checking ? 'Checking…' : 'Continue' }}
      </button>

      <button
        class="w-full mt-3 text-xs font-semibold text-garden-primary hover:underline underline-offset-2"
        @click="mode = 'scan'"
      >
        ← Scan QR code instead
      </button>
    </div>

    <p v-if="gateError" class="mt-3 text-xs font-semibold text-garden-danger text-center">
      {{ gateError }}
    </p>

    <p class="text-center text-[11px] text-garden-dim mt-6">
      Already have an account?
      <router-link to="/login" class="font-semibold text-garden-primary hover:underline">Sign in</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQrScanner } from '@/composables/useQrScanner'
import { checkDeviceAccessCode, extractCodeFromScan } from '@/auth/useDeviceAccessCode'

const emit = defineEmits(['verified'])

const mode       = ref('scan') // 'scan' | 'manual'
const videoRef    = ref(null)
const manualCode = ref('')
const checking    = ref(false)
const gateError   = ref('')

const scanner = useQrScanner()
watch(videoRef, (el) => scanner.bindVideo(el))

async function beginScan() {
  gateError.value = ''
  await scanner.start()
}

// Whenever jsQR decodes a frame, decodedValue flips — validate it.
watch(scanner.decodedValue, async (value) => {
  if (!value) return
  await verify(extractCodeFromScan(value))
})

async function submitManual() {
  if (!manualCode.value || checking.value) return
  await verify(manualCode.value)
}

async function verify(code) {
  gateError.value = ''
  checking.value  = true
  try {
    const result = await checkDeviceAccessCode(code)
    if (result.ok) {
      emit('verified', { code: result.code, systemId: result.systemId })
    } else {
      gateError.value = result.error
      // Let them try again — restart the camera if that's the active mode.
      if (mode.value === 'scan') await scanner.start()
    }
  } finally {
    checking.value = false
  }
}
</script>