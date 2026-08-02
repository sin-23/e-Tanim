<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <div
        v-for="s in pairedSystems"
        :key="s.id"
        class="px-3.5 py-3 rounded-xl border border-garden-border bg-garden-base"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div
              class="w-2 h-2 rounded-full flex-shrink-0"
              :class="s.status === 'Online' ? 'bg-garden-good' : 'bg-garden-dim'"
            />
            <div>
              <div class="text-xs font-extrabold text-garden-text font-mono">{{ s.id }}</div>
              <div class="text-[10px] text-garden-dim">{{ s.label }} · 3 zones</div>
            </div>
          </div>
          <span
            class="text-[10px] font-bold px-2 py-0.5 rounded-full"
            :class="s.status === 'Online'
              ? 'bg-garden-good/15 text-garden-good'
              : 'bg-garden-border text-garden-dim'"
          >
            {{ s.status }}
          </span>
        </div>
        <div class="flex flex-wrap gap-1.5 mt-2.5 pl-4.5">
          <span
            v-for="zone in s.zones"
            :key="zone"
            class="text-[10px] font-semibold px-2 py-1 rounded-lg bg-garden-surface border border-garden-border text-garden-dim"
          >
            {{ zone }}
          </span>
        </div>
      </div>
    </div>

    <button
      v-if="step === 'idle'"
      class="w-full py-2.5 rounded-xl border-2 border-dashed border-garden-primary/40 text-sm font-bold text-garden-primary hover:bg-garden-base transition-colors flex items-center justify-center gap-2"
      @click="startPairing"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
      </svg>
      Pair New System
    </button>

    <div
      v-else-if="step === 'scanning'"
      class="rounded-2xl border border-garden-border p-5 bg-garden-base flex flex-col items-center gap-4"
    >
      <div class="text-xs font-bold text-garden-dim uppercase tracking-widest">Scan with ESP32 Device</div>

      <!-- Deterministic placeholder QR pattern, seeded from the device ID.
           Visual only — not a real scannable code. -->
      <div class="p-3 bg-white rounded-2xl shadow-sm border border-garden-border">
        <svg :width="qrSize" :height="qrSize" :viewBox="`0 0 ${qrSize} ${qrSize}`" shape-rendering="crispEdges">
          <rect :width="qrSize" :height="qrSize" fill="white" rx="6" />
          <template v-for="(row, r) in qrMatrix" :key="r">
            <rect
              v-for="(on, c) in row"
              v-show="on"
              :key="c"
              :x="c * qrCell"
              :y="r * qrCell"
              :width="qrCell"
              :height="qrCell"
              fill="#1a2e22"
            />
          </template>
        </svg>
      </div>

      <div class="text-center space-y-1">
        <div class="flex items-center justify-center gap-2 text-xs text-garden-dim">
          <svg class="animate-spin text-garden-primary" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Waiting for device…
        </div>
        <div class="font-mono text-[10px] text-garden-dim">{{ deviceId }}</div>
      </div>
      <button class="text-xs font-semibold text-garden-dim hover:text-garden-text transition-colors underline underline-offset-2" @click="reset">
        Cancel
      </button>
    </div>

    <div
      v-else-if="step === 'paired'"
      class="rounded-2xl border border-garden-good/40 bg-garden-good/10 p-5 flex flex-col items-center gap-3 text-center"
    >
      <div class="w-12 h-12 rounded-full bg-garden-good/20 flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-garden-good">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <div>
        <div class="text-sm font-extrabold text-garden-good">System Paired!</div>
        <div class="font-mono text-[10px] text-garden-good/70 mt-0.5">{{ deviceId }}</div>
      </div>
      <button class="px-4 py-1.5 rounded-xl bg-garden-primary text-white text-xs font-bold hover:opacity-90 transition-colors" @click="reset">
        Pair Another
      </button>
    </div>

    <p class="text-[10px] text-garden-dim/70">
      Pairing is per-system (ESP32), not per-zone — each paired system automatically brings its 3 attached zones online.
      Not wired up to real hardware yet.
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Placeholder representative data — two ESP32 controllers, three zones each.
// Will be replaced by data read from Firebase (e.g. `systems/{systemId}`)
// once pairing is wired up.
const pairedSystems = ref([
  { id: 'ESP32-SYS-01', label: 'System 1', zones: ['Tomato', 'Eggplant', 'Okra'], status: 'Online' },
  { id: 'ESP32-SYS-02', label: 'System 2', zones: ['Tomato', 'Eggplant', 'Okra'], status: 'Offline' },
])

const step     = ref('idle') // idle | scanning | paired
const deviceId = ref('')

let pairTimer = null

function startPairing() {
  deviceId.value = 'ESP32-SYS-' + Math.random().toString(36).slice(2, 6).toUpperCase()
  step.value = 'scanning'
  pairTimer = setTimeout(() => { step.value = 'paired' }, 4000)
}

function reset() {
  clearTimeout(pairTimer)
  step.value = 'idle'
}

// ── Placeholder QR pattern generator ──────────────────────────
// Deterministic pseudo-QR seeded from deviceId, purely decorative.
const qrSize = 168
const N = 25
const qrCell = qrSize / N

const qrMatrix = computed(() => {
  const value = deviceId.value || 'etanim'
  let seed = 0
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) & 0xffffffff
  function rand() {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    return (seed >>> 0) / 0x100000000
  }

  const M = Array.from({ length: N }, () => Array(N).fill(false))

  function finder(r0, c0) {
    for (let dr = 0; dr < 7; dr++) {
      for (let dc = 0; dc < 7; dc++) {
        M[r0 + dr][c0 + dc] =
          dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)
      }
    }
  }
  finder(0, 0); finder(0, N - 7); finder(N - 7, 0)

  for (let i = 8; i < N - 8; i++) { M[6][i] = i % 2 === 0; M[i][6] = i % 2 === 0 }

  const AP = N - 7
  for (let dr = 0; dr < 5; dr++) {
    for (let dc = 0; dc < 5; dc++) {
      M[AP + dr][AP + dc] = dr === 0 || dr === 4 || dc === 0 || dc === 4 || (dr === 2 && dc === 2)
    }
  }

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const isFinder = (r < 9 && c < 9) || (r < 9 && c >= N - 8) || (r >= N - 8 && c < 9)
      if (!isFinder && r !== 6 && c !== 6 && !(r >= AP && r <= AP + 4 && c >= AP && c <= AP + 4)) {
        M[r][c] = rand() > 0.48
      }
    }
  }
  return M
})
</script>