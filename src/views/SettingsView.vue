<template>
  <div class="p-4 lg:p-6 pb-12 max-w-2xl mx-auto space-y-5">

    <div class="mb-2">
      <h1 class="text-xl font-extrabold text-garden-text">Settings</h1>
      <p class="text-sm text-garden-dim mt-0.5">Manage your preferences and IoT devices.</p>
    </div>

    <!-- ══════════════════════════════════════════════════════
         Change Password
         ══════════════════════════════════════════════════════ -->
    <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden">
      <div class="px-5 pt-5 pb-4 border-b border-garden-border flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-garden-base flex items-center justify-center text-lg flex-shrink-0">🔐</div>
        <div>
          <div class="text-sm font-extrabold text-garden-text">Change Password</div>
          <div class="text-[11px] text-garden-dim mt-0.5 font-medium">Update your account password.</div>
        </div>
      </div>

      <div class="p-5 space-y-3">
        <!-- Current password -->
        <div>
          <label class="block text-xs font-bold text-garden-text mb-1.5">Current Password</label>
          <div class="relative">
            <input
              :type="showCur ? 'text' : 'password'"
              v-model="cur"
              placeholder="••••••••"
              class="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-garden-border bg-garden-base text-sm font-semibold text-garden-text placeholder:text-garden-dim/60 focus:outline-none focus:border-garden-primary focus:ring-2 focus:ring-garden-primary/15 transition-all"
            />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-garden-dim hover:text-garden-primary transition-colors" @click="showCur = !showCur">
              <svg v-if="showCur" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        <!-- New password -->
        <div>
          <label class="block text-xs font-bold text-garden-text mb-1.5">New Password</label>
          <div class="relative">
            <input
              :type="showNext ? 'text' : 'password'"
              v-model="next"
              placeholder="••••••••"
              class="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-garden-border bg-garden-base text-sm font-semibold text-garden-text placeholder:text-garden-dim/60 focus:outline-none focus:border-garden-primary focus:ring-2 focus:ring-garden-primary/15 transition-all"
            />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-garden-dim hover:text-garden-primary transition-colors" @click="showNext = !showNext">
              <svg v-if="showNext" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
          <div v-if="next.length > 0" class="mt-1.5 flex items-center gap-2">
            <div class="flex-1 h-1 rounded-full bg-garden-border overflow-hidden">
              <div class="h-full rounded-full transition-all duration-300" :style="{ width: `${(strength / 3) * 100}%`, backgroundColor: strengthColor }" />
            </div>
            <span class="text-[10px] font-bold" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
          </div>
        </div>

        <!-- Confirm password -->
        <div>
          <label class="block text-xs font-bold text-garden-text mb-1.5">Confirm New Password</label>
          <input
            type="password"
            v-model="confirm"
            placeholder="••••••••"
            class="w-full px-3.5 py-2.5 rounded-xl border border-garden-border bg-garden-base text-sm font-semibold text-garden-text placeholder:text-garden-dim/60 focus:outline-none focus:border-garden-primary focus:ring-2 focus:ring-garden-primary/15 transition-all"
          />
        </div>

        <div v-if="status === 'err' && errMsg" class="flex items-center gap-2 px-3 py-2 rounded-xl bg-garden-danger/10 border border-garden-danger/40">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-garden-danger flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span class="text-[11px] font-semibold text-garden-danger">{{ errMsg }}</span>
        </div>
        <div v-if="status === 'ok'" class="flex items-center gap-2 px-3 py-2 rounded-xl bg-garden-good/10 border border-garden-good/40">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-garden-good flex-shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span class="text-[11px] font-semibold text-garden-good">Password updated successfully.</span>
        </div>

        <button
          class="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-garden-primary hover:opacity-90 transition-colors disabled:opacity-60"
          :disabled="status === 'loading'"
          @click="savePassword"
        >
          <span v-if="status === 'loading'" class="flex items-center justify-center gap-2">
            <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Updating…
          </span>
          <span v-else>Update Password</span>
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         Display Preferences
         ══════════════════════════════════════════════════════ -->
    <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden">
      <div class="px-5 pt-5 pb-4 border-b border-garden-border flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-garden-base flex items-center justify-center text-lg flex-shrink-0">🎨</div>
        <div>
          <div class="text-sm font-extrabold text-garden-text">Display Preferences</div>
          <div class="text-[11px] text-garden-dim mt-0.5 font-medium">Adjust how data and the interface appear.</div>
        </div>
      </div>

      <div class="p-5 space-y-5">

        <!-- Dark mode (the only toggle actually wired up) -->
        <div>
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-sm font-bold text-garden-text">Dark Mode</div>
              <div class="text-[11px] text-garden-dim mt-0.5">Switch to a low-glare dark palette suited for night-time use.</div>
            </div>
            <button
              role="switch" :aria-checked="isDarkMode"
              class="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-garden-primary/30"
              :class="isDarkMode ? 'bg-garden-primary' : 'bg-garden-border'"
              @click="toggleDarkMode"
            >
              <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200" :style="{ transform: isDarkMode ? 'translateX(20px)' : 'translateX(0)' }" />
            </button>
          </div>
          <div v-if="isDarkMode" class="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-garden-base border border-garden-border">
            <span class="text-sm">🌙</span>
            <span class="text-[11px] font-semibold text-garden-primary">Dark mode is active</span>
          </div>
        </div>

        <div class="h-px bg-garden-border" />

        <!-- Temp unit -->
        <div>
          <div class="text-xs font-bold text-garden-text mb-2">Temperature Unit</div>
          <div class="flex gap-2">
            <button
              class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border"
              :class="unit === 'C' ? 'bg-garden-primary text-white border-garden-primary' : 'bg-transparent border-garden-border text-garden-dim hover:bg-garden-base'"
              @click="setTempUnit('C')"
            >°C — Celsius</button>
            <button
              class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border"
              :class="unit === 'F' ? 'bg-garden-primary text-white border-garden-primary' : 'bg-transparent border-garden-border text-garden-dim hover:bg-garden-base'"
              @click="setTempUnit('F')"
            >°F — Fahrenheit</button>
          </div>
          <p class="text-[11px] text-garden-dim mt-2">
            All sensor readings will display in
            <strong class="text-garden-text">{{ unit === 'C' ? 'Celsius (°C)' : 'Fahrenheit (°F)' }}</strong>.
            <span v-if="unit === 'F'"> Values are converted from raw °C sensor data.</span>
          </p>
        </div>

        <div class="h-px bg-garden-border" />

        <!-- Notifications -->
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-sm font-bold text-garden-text">Push Notifications</div>
            <div class="text-[11px] text-garden-dim mt-0.5">Receive alerts for low reservoirs, sensor faults, and harvest detections.</div>
          </div>
          <button
            role="switch" :aria-checked="notifications"
            class="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-garden-primary/30"
            :class="notifications ? 'bg-garden-primary' : 'bg-garden-border'"
            @click="notifications = !notifications"
          >
            <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200" :style="{ transform: notifications ? 'translateX(20px)' : 'translateX(0)' }" />
          </button>
        </div>

        <!-- Auto-irrigation -->
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-sm font-bold text-garden-text">Auto-Irrigation</div>
            <div class="text-[11px] text-garden-dim mt-0.5">Allow the system to trigger pump circuits automatically based on thresholds.</div>
          </div>
          <button
            role="switch" :aria-checked="autoIrrigation"
            class="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-garden-primary/30"
            :class="autoIrrigation ? 'bg-garden-primary' : 'bg-garden-border'"
            @click="autoIrrigation = !autoIrrigation"
          >
            <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200" :style="{ transform: autoIrrigation ? 'translateX(20px)' : 'translateX(0)' }" />
          </button>
        </div>
        <p class="text-[10px] text-garden-dim/70 -mt-3">Not wired up yet — display only.</p>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         IoT System Pairing
         ══════════════════════════════════════════════════════ -->
    <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden">
      <div class="px-5 pt-5 pb-4 border-b border-garden-border flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-garden-base flex items-center justify-center text-lg flex-shrink-0">📡</div>
        <div>
          <div class="text-sm font-extrabold text-garden-text">IoT System Pairing</div>
          <div class="text-[11px] text-garden-dim mt-0.5 font-medium">Connect ESP32 controllers to your account via QR code. Each system reports 3 garden zones.</div>
        </div>
      </div>
      <div class="p-5">
        <IotPairingSection />
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         About
         ══════════════════════════════════════════════════════ -->
    <div class="px-5 py-4 rounded-2xl border border-garden-border bg-garden-surface flex items-center justify-between">
      <div>
        <div class="text-xs font-bold text-garden-text">e-Tanim System</div>
        <div class="font-mono text-[10px] text-garden-dim mt-0.5">v2.4.1 · Off-grid IoT · ESP32</div>
      </div>
      <button class="text-xs font-bold text-garden-primary hover:underline underline-offset-2 transition-colors">
        Check for updates
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'
import { useTempUnit } from '@/composables/useTempUnit'
import { useAuth } from '@/auth/useAuth'
import IotPairingSection from '@/components/IotPairingSection.vue'

const { isDarkMode, toggleDarkMode } = useDarkMode()
const { changePassword } = useAuth()

// ── Change password ──────────────────────────────────────────
const cur      = ref('')
const next     = ref('')
const confirm  = ref('')
const showCur  = ref(false)
const showNext = ref(false)
const status   = ref('idle') // idle | loading | ok | err
const errMsg   = ref('')

const strength = computed(() => {
  if (next.value.length === 0) return 0
  if (next.value.length < 6)  return 1
  if (next.value.length < 10) return 2
  return 3
})
const strengthLabel = computed(() => ['', 'Weak', 'Fair', 'Strong'][strength.value])
const strengthColor = computed(() => ['', '#ef4444', '#f59e0b', '#22c55e'][strength.value])

const FIREBASE_ERROR_MESSAGES = {
  'auth/wrong-password':        'Current password is incorrect.',
  'auth/invalid-credential':    'Current password is incorrect.',
  'auth/weak-password':         'New password is too weak.',
  'auth/requires-recent-login': 'Please sign out and back in, then try again.',
  'auth/no-current-user':       'You need to be signed in to change your password.',
}

async function savePassword() {
  if (!cur.value || !next.value || !confirm.value) {
    errMsg.value = 'All fields are required.'
    status.value = 'err'
    return
  }
  if (next.value !== confirm.value) {
    errMsg.value = 'New passwords do not match.'
    status.value = 'err'
    return
  }
  if (next.value.length < 6) {
    errMsg.value = 'Password must be at least 6 characters.'
    status.value = 'err'
    return
  }

  errMsg.value = ''
  status.value = 'loading'
  try {
    await changePassword(cur.value, next.value)
    status.value = 'ok'
    cur.value = ''
    next.value = ''
    confirm.value = ''
  } catch (e) {
    errMsg.value = FIREBASE_ERROR_MESSAGES[e?.code] || 'Could not update password. Please try again.'
    status.value = 'err'
  }
}

// ── Display preferences ──────────────────────────────────────
// Temperature unit is a shared, localStorage-persisted preference (see
// useTempUnit) so every view converts the same way. It only affects how
// Celsius sensor readings are displayed — thresholds and Firebase/ESP32
// data stay in Celsius.
const { tempUnit: unit, setTempUnit } = useTempUnit()
const notifications  = ref(true)
const autoIrrigation = ref(true)
</script>