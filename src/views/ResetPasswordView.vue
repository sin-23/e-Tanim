<template>
  <div class="min-h-screen flex">

    <!-- ── Left panel: branding (identical to LoginView/RegisterView) ── -->
    <div
      class="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
      style="background-color: #1a2e22"
    >
      <div
        class="absolute inset-0 opacity-20"
        style="background-image: radial-gradient(circle at center, rgba(255,255,255,0.4) 1px, transparent 1.2px); background-size: 28px 28px;"
      />
      <div
        class="absolute top-[-120px] left-[-80px] w-[480px] h-[480px] rounded-full opacity-30"
        style="background: radial-gradient(circle, #2d7a4f 0%, transparent 70%)"
      />
      <div
        class="absolute bottom-[-100px] right-[-60px] w-[360px] h-[360px] rounded-full opacity-20"
        style="background: radial-gradient(circle, #3b9dd2 0%, transparent 70%)"
      />

      <div class="relative z-10 flex flex-col h-full p-12">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-garden-primary flex items-center justify-center">
            <span class="text-lg">🌱</span>
          </div>
          <div>
            <div class="text-xl font-bold text-white tracking-tight">e-Tanim</div>
            <div class="text-[10px] font-semibold tracking-widest uppercase text-white/40">Smart Garden AI</div>
          </div>
        </div>

        <div class="flex-1 flex flex-col justify-center max-w-sm">
          <h1 class="text-4xl font-bold text-white leading-tight mb-4">
            AI-Assisted Integrated<br />
            <span style="color: #4ade80">Crop Management System</span><br />
            for Household Garden
          </h1>
          <p class="text-sm text-white/50 font-medium leading-relaxed mb-8">
            Monitor soil moisture, automate irrigation, and get AI-powered harvest detection — all from one dashboard.
          </p>
        </div>
      </div>
    </div>

    <!-- ── Right panel: form ──────────────────────────────────── -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-garden-void">

      <!-- Mobile logo -->
      <div class="lg:hidden flex items-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-xl bg-garden-primary flex items-center justify-center">
          <span class="text-lg">🌱</span>
        </div>
        <div>
          <div class="text-xl font-bold text-garden-text">e-Tanim</div>
          <div class="text-[10px] font-semibold tracking-widest uppercase text-garden-dim">Smart Garden AI</div>
        </div>
      </div>

      <!-- ── Checking the link ──────────────────────────────────── -->
      <div v-if="status === 'checking'" class="w-full max-w-sm text-center space-y-3">
        <div class="w-10 h-10 mx-auto rounded-full border-2 border-garden-border border-t-garden-primary animate-spin" />
        <p class="text-sm text-garden-dim font-medium">Verifying your reset link…</p>
      </div>

      <!-- ── Invalid / expired link ──────────────────────────────── -->
      <div
        v-else-if="status === 'invalid'"
        class="w-full max-w-sm rounded-2xl p-8 text-center space-y-4 border bg-garden-surface"
        style="border-color: rgb(var(--garden-border)); box-shadow: 0 8px 40px rgba(45,122,79,0.08)"
      >
        <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto border"
             style="background: rgba(217,79,79,0.08); border-color: rgba(217,79,79,0.25)">
          ✕
        </div>
        <div>
          <h2 class="text-xl font-semibold text-garden-text mb-1">Link expired or invalid</h2>
          <p class="text-sm text-garden-dim">{{ invalidReason }}</p>
        </div>
        <router-link
          to="/login"
          class="inline-block w-full py-3 rounded-xl font-medium text-sm bg-garden-text text-garden-void transition-colors"
        >
          Back to Sign In
        </router-link>
      </div>

      <!-- ── Success state ───────────────────────────────────────── -->
      <div
        v-else-if="status === 'success'"
        class="w-full max-w-sm rounded-2xl p-8 text-center space-y-4 border bg-garden-surface"
        style="border-color: rgb(var(--garden-border)); box-shadow: 0 8px 40px rgba(45,122,79,0.08)"
      >
        <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto border"
             style="background: rgba(45,122,79,0.08); border-color: rgba(45,122,79,0.25)">
          ✓
        </div>
        <div>
          <h2 class="text-xl font-semibold text-garden-text mb-1">Password Reset</h2>
          <p class="text-sm text-garden-dim">Your password has been updated. You can now sign in with it.</p>
        </div>
        <p class="text-xs font-mono text-garden-dim">Redirecting to sign in…</p>
        <div class="h-1 w-full rounded-full overflow-hidden bg-garden-border">
          <div class="h-full rounded-full bg-garden-primary" style="animation: progress 2.2s ease-in-out forwards" />
        </div>
      </div>

      <!-- ── Set new password form ───────────────────────────────── -->
      <div v-else class="w-full max-w-sm">
        <div class="mb-8">
          <h2 class="text-2xl font-semibold text-garden-text mb-1.5">Set a New Password</h2>
          <p class="text-sm font-medium text-garden-dim" v-if="accountEmail">
            for <span class="font-semibold text-garden-text">{{ accountEmail }}</span>
          </p>
        </div>

        <div class="space-y-3">
          <!-- New password -->
          <div>
            <label class="block text-xs font-medium text-garden-text mb-1.5">New Password</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="At least 8 characters"
                class="w-full px-4 py-3 pr-14 rounded-xl border bg-garden-surface text-sm font-semibold
                       text-garden-text placeholder:text-garden-dim/50 focus:outline-none
                       focus:ring-2 transition-all"
                :class="fieldBorderClass(passwordTouched, passwordError)"
                @blur="passwordTouched = true"
                @keydown.enter="handleSubmit"
              />
              <button
                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium
                       text-garden-dim hover:text-garden-text transition-colors"
                type="button"
                tabindex="-1"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? 'hide' : 'show' }}
              </button>
            </div>

            <!-- Strength bar -->
            <div class="mt-2 flex gap-1">
              <div
                v-for="n in 4"
                :key="n"
                class="flex-1 h-1 rounded-full transition-all duration-300"
                :style="{ background: (password && n <= passwordStrength) ? STRENGTH_COLORS[passwordStrength] : 'rgb(var(--garden-border))' }"
              />
            </div>
            <p v-if="password" class="mt-1 text-[10px] font-mono" :style="{ color: STRENGTH_COLORS[passwordStrength] }">
              {{ strengthLabel }}
            </p>

            <p v-if="passwordTouched && passwordError" class="mt-1 text-xs text-garden-danger">
              {{ passwordError }}
            </p>
          </div>

          <!-- Confirm password -->
          <div>
            <label class="block text-xs font-medium text-garden-text mb-1.5">Confirm New Password</label>
            <input
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Re-enter password"
              class="w-full px-4 py-3 rounded-xl border bg-garden-surface text-sm font-semibold
                     text-garden-text placeholder:text-garden-dim/50 focus:outline-none
                     focus:ring-2 transition-all"
              :class="fieldBorderClass(confirmTouched, confirmError)"
              @blur="confirmTouched = true"
              @keydown.enter="handleSubmit"
            />
            <p v-if="confirmTouched && confirmError" class="mt-1 text-xs text-garden-danger">
              {{ confirmError }}
            </p>
          </div>
        </div>

        <!-- Server error -->
        <p v-if="serverError" class="mt-3 text-xs text-garden-danger">{{ serverError }}</p>

        <!-- Submit -->
        <button
          class="w-full py-3 rounded-xl font-medium text-sm transition-colors
                 disabled:cursor-not-allowed mt-5"
          :class="submitting
            ? 'bg-garden-base text-garden-dim opacity-70'
            : 'bg-garden-text text-garden-void'"
          :disabled="submitting || !!passwordError || !!confirmError"
          @click="handleSubmit"
        >
          {{ submitting ? 'Updating…' : 'Update Password' }}
        </button>

        <p class="text-center text-[11px] text-garden-dim mt-6">
          <router-link to="/login" class="font-semibold text-garden-primary hover:underline">← Back to Sign In</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import { useAuth }                  from '@/auth/useAuth'

const route  = useRoute()
const router = useRouter()
const { verifyResetCode, confirmReset } = useAuth()

// 'checking' | 'form' | 'invalid' | 'success'
const status        = ref('checking')
const invalidReason = ref('')
const accountEmail  = ref('')
const oobCode       = ref('')

const password        = ref('')
const confirmPassword = ref('')
const showPassword    = ref(false)
const passwordTouched = ref(false)
const confirmTouched  = ref(false)
const submitting      = ref(false)
const serverError     = ref('')

function fieldBorderClass(touched, error) {
  if (!touched)
    return 'border-garden-border focus:border-garden-primary focus:ring-[#2d7a4f]/15'
  if (error)
    return 'border-garden-danger focus:border-garden-danger focus:ring-garden-danger/15'
  return 'border-garden-primary/50 focus:border-garden-primary focus:ring-garden-primary/15'
}

const passwordError = computed(() => {
  if (!password.value) return 'Password is required'
  if (password.value.length < 8) return 'At least 8 characters'
  return ''
})
const confirmError = computed(() => {
  if (!confirmPassword.value) return 'Please confirm your password'
  if (confirmPassword.value !== password.value) return 'Passwords do not match'
  return ''
})

const passwordStrength = computed(() => {
  const p = password.value
  if (!p) return 0
  let score = 0
  if (p.length >= 8)  score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/[0-9]/.test(p) || /[^A-Za-z0-9]/.test(p)) score++
  return score
})
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#f59e0b', '#2d7a4f']
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const strengthLabel   = computed(() => password.value ? STRENGTH_LABELS[passwordStrength.value] : '')

function friendlyInvalidReason(code) {
  const map = {
    'auth/expired-action-code': 'This reset link has expired. Request a new one from the sign-in page.',
    'auth/invalid-action-code': 'This reset link has already been used or is invalid. Request a new one.',
    'auth/user-disabled':       'This account has been disabled. Contact support for help.',
    'auth/user-not-found':      'We couldn\'t find an account for this reset link.',
  }
  return map[code] ?? 'This reset link isn\'t valid. Request a new one from the sign-in page.'
}

function friendlyServerError(code) {
  const map = {
    'auth/weak-password':          'Password is too weak. Use at least 8 characters.',
    'auth/expired-action-code':    'This reset link expired while you were filling this out. Request a new one.',
    'auth/invalid-action-code':    'This reset link has already been used. Request a new one.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}

onMounted(async () => {
  const mode = route.query.mode
  const code = route.query.oobCode

  if (mode !== 'resetPassword' || !code) {
    status.value        = 'invalid'
    invalidReason.value = 'This link is missing required information. Request a new reset link from the sign-in page.'
    return
  }

  oobCode.value = code
  try {
    accountEmail.value = await verifyResetCode(code)
    status.value = 'form'
  } catch (err) {
    status.value        = 'invalid'
    invalidReason.value = friendlyInvalidReason(err.code)
  }
})

async function handleSubmit() {
  passwordTouched.value = true
  confirmTouched.value  = true
  if (passwordError.value || confirmError.value || submitting.value) return

  serverError.value = ''
  submitting.value   = true
  try {
    await confirmReset(oobCode.value, password.value)
    status.value = 'success'
    setTimeout(() => router.push('/login'), 2200)
  } catch (err) {
    serverError.value = friendlyServerError(err.code)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
@keyframes progress {
  from { width: 0% }
  to   { width: 100% }
}
</style>