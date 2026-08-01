<template>
  <div class="min-h-screen flex">

    <!-- ── Left panel: branding ──────────────────────────────── -->
    <div
      class="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
      style="background-color: #1a2e22"
    >
      <!-- Subtle dot grid -->
      <div
        class="absolute inset-0 opacity-20"
        style="background-image: radial-gradient(circle at center, rgba(255,255,255,0.4) 1px, transparent 1.2px); background-size: 28px 28px;"
      />

      <!-- Organic green glow blobs -->
      <div
        class="absolute top-[-120px] left-[-80px] w-[480px] h-[480px] rounded-full opacity-30"
        style="background: radial-gradient(circle, #2d7a4f 0%, transparent 70%)"
      />
      <div
        class="absolute bottom-[-100px] right-[-60px] w-[360px] h-[360px] rounded-full opacity-20"
        style="background: radial-gradient(circle, #3b9dd2 0%, transparent 70%)"
      />

      <!-- Content -->
      <div class="relative z-10 flex flex-col h-full p-12">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[#2d7a4f] flex items-center justify-center">
            <span class="text-lg">🌱</span>
          </div>
          <div>
            <div class="text-xl font-bold text-white tracking-tight">e-Tanim</div>
            <div class="text-[10px] font-semibold tracking-widest uppercase text-white/40">Smart Garden AI</div>
          </div>
        </div>

        <!-- Hero text -->
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

        <!-- Bottom sensor strip — live Firebase averages -->
        <div class="grid grid-cols-3 gap-3">
          <div v-for="s in sensorStrip" :key="s.label" class="p-3 rounded-xl bg-white/6 border border-white/10">
            <div class="text-base mb-1">{{ s.icon }}</div>
            <div class="text-sm font-medium font-mono text-white">{{ s.value }}</div>
            <div class="text-[10px] text-white/40 font-medium mt-0.5">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Right panel: form ──────────────────────────────────── -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#f4f8f5]">

      <!-- Mobile logo -->
      <div class="lg:hidden flex items-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-xl bg-[#2d7a4f] flex items-center justify-center">
          <span class="text-lg">🌱</span>
        </div>
        <div>
          <div class="text-xl font-bold text-[#1a2e22]">e-Tanim</div>
          <div class="text-[10px] font-semibold tracking-widest uppercase text-[#6b8070]">Smart Garden AI</div>
        </div>
      </div>

      <div class="w-full max-w-sm">

        <!-- ── Forgot password sub-view ─────────────────────────── -->
        <template v-if="showForgot">
          <button
            class="text-xs font-semibold text-[#6b8070] flex items-center gap-1 hover:text-[#1a2e22] transition-colors mb-6"
            @click="showForgot = false"
          >
            ← Back to Sign In
          </button>

          <div class="mb-6">
            <h2 class="text-2xl font-semibold text-[#1a2e22] mb-1.5">Reset Password</h2>
            <p class="text-sm text-[#6b8070] font-medium">Enter your email and we'll send a reset link.</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-[#1a2e22] mb-1.5">Email address</label>
              <input
                v-model="resetEmail"
                type="email"
                placeholder="you@etanim.ph"
                class="w-full px-4 py-3 rounded-xl border border-[#d8e8de] bg-white text-sm font-semibold
                       text-[#1a2e22] placeholder:text-[#b0bfb8] focus:outline-none focus:border-[#2d7a4f]
                       focus:ring-2 focus:ring-[#2d7a4f]/15 transition-all"
                @keydown.enter="handleReset"
              />
            </div>

            <p v-if="resetMsg" class="text-xs font-semibold" :class="resetError ? 'text-[#dc2626]' : 'text-[#15803d]'">
              {{ resetMsg }}
            </p>

            <button
              class="w-full py-3 rounded-xl bg-[#2d7a4f] text-white font-medium text-sm
                     hover:bg-[#246040] active:bg-[#1d5035] transition-colors shadow-sm
                     disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="resetLoading || !resetEmail || cooldownRemaining > 0"
              @click="handleReset"
            >
              {{ resetButtonLabel }}
            </button>
          </div>
        </template>

        <!-- ── Login form ────────────────────────────────────────── -->
        <template v-else>
          <div class="mb-8">
            <h2 class="text-2xl font-semibold text-[#1a2e22] mb-1.5">Welcome back</h2>
            <p class="text-sm text-[#6b8070] font-medium">Sign in to your garden dashboard</p>
          </div>

          <form class="space-y-4" @submit.prevent="handleEmail">

            <!-- Email -->
            <div>
              <label class="block text-xs font-medium text-[#1a2e22] mb-1.5">Email address</label>
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="you@etanim.ph"
                class="w-full px-4 py-3 rounded-xl border border-[#d8e8de] bg-white text-sm font-semibold
                       text-[#1a2e22] placeholder:text-[#b0bfb8] focus:outline-none focus:border-[#2d7a4f]
                       focus:ring-2 focus:ring-[#2d7a4f]/15 transition-all"
              />
            </div>

            <!-- Password -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-medium text-[#1a2e22]">Password</label>
                <button
                  type="button"
                  class="text-xs font-semibold text-[#2d7a4f] hover:text-[#246040] transition-colors"
                  @click="showForgot = true"
                >
                  Forgot password?
                </button>
              </div>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full px-4 py-3 pr-11 rounded-xl border border-[#d8e8de] bg-white text-sm font-semibold
                         text-[#1a2e22] placeholder:text-[#b0bfb8] focus:outline-none focus:border-[#2d7a4f]
                         focus:ring-2 focus:ring-[#2d7a4f]/15 transition-all"
                />
                <button
                  type="button"
                  tabindex="-1"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b8070] hover:text-[#2d7a4f] transition-colors p-1"
                  @click="showPassword = !showPassword"
                >
                  <svg v-if="showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Error -->
            <div v-if="errorMsg" class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#fee2e2] border border-[#fca5a5]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span class="text-xs font-semibold text-[#991b1b]">{{ errorMsg }}</span>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading || !email || !password"
              class="w-full py-3 rounded-xl bg-[#2d7a4f] text-white font-medium text-sm
                     hover:bg-[#246040] active:bg-[#1d5035] transition-colors shadow-sm
                     disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              <svg v-if="loading" class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              {{ loading ? 'Signing in…' : 'Sign In' }}
            </button>
          </form>

          <!-- Divider -->
          <div class="flex items-center gap-3 my-5">
            <div class="flex-1 h-px bg-[#d8e8de]" />
            <span class="text-[10px] font-semibold text-[#6b8070] uppercase tracking-widest">or</span>
            <div class="flex-1 h-px bg-[#d8e8de]" />
          </div>

          <!-- Google sign-in -->
          <button
            type="button"
            :disabled="loading"
            class="w-full py-3 rounded-xl border border-[#d8e8de] bg-white text-[#1a2e22] font-medium text-sm
                   hover:bg-[#eef3f0] hover:border-[#2d7a4f]/40 transition-colors flex items-center
                   justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            @click="handleGoogle"
          >
            <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <!-- Register link -->
          <p class="text-center text-[11px] text-[#6b8070] mt-6">
            Don't have an account?
            <router-link to="/register" class="font-semibold text-[#2d7a4f] hover:underline">Create account →</router-link>
          </p>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/auth/useAuth'
import { db } from '@/firebase'
import { checkRateLimit, peekRateLimit, formatResetTime } from '@/security/rateLimiter'

const RESET_WINDOW_MS = 15 * 60 * 1000
const RESET_MAX_ATTEMPTS = 3
const RESEND_COOLDOWN_MS = 60 * 1000

const router = useRouter()
const route  = useRoute()
const { loginWithEmail, loginWithGoogle, resetPassword } = useAuth()

const email        = ref('')
const password     = ref('')
const showPassword = ref(false)
const loading      = ref(false)
const errorMsg     = ref('')

const showForgot   = ref(false)
const resetEmail   = ref('')
const resetLoading = ref(false)
const resetMsg     = ref('')
const resetError   = ref(false)

// ── Resend cooldown timer ─────────────────────────────────────────────
const cooldownUntil    = ref(0)   // epoch ms; 0 = no active cooldown
const cooldownRemaining = ref(0)  // seconds left, ticked every second
let cooldownInterval = null

function resetKeyFor(emailValue) {
  return `password-reset:${emailValue.trim().toLowerCase()}`
}

function stopCooldownTimer() {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
    cooldownInterval = null
  }
}

function tickCooldown() {
  const remainingMs = cooldownUntil.value - Date.now()
  if (remainingMs <= 0) {
    cooldownRemaining.value = 0
    cooldownUntil.value = 0
    stopCooldownTimer()
    return
  }
  cooldownRemaining.value = Math.ceil(remainingMs / 1000)
}

function startCooldown(untilMs) {
  cooldownUntil.value = untilMs
  tickCooldown()
  stopCooldownTimer()
  if (cooldownRemaining.value > 0) {
    cooldownInterval = setInterval(tickCooldown, 1000)
  }
}

// Restore an in-progress cooldown (from the rate limiter, persisted across
// reloads) whenever the reset email field has a value worth checking —
// on mount and whenever the user edits the email.
function syncCooldownFromLimiter(emailValue) {
  if (!emailValue) {
    cooldownUntil.value = 0
    cooldownRemaining.value = 0
    stopCooldownTimer()
    return
  }
  const key = resetKeyFor(emailValue)
  const { allowed, resetAt } = peekRateLimit(key, {
    windowMs: RESET_WINDOW_MS,
    maxAttempts: RESET_MAX_ATTEMPTS,
  })
  if (!allowed) {
    startCooldown(resetAt)
  } else {
    cooldownUntil.value = 0
    cooldownRemaining.value = 0
    stopCooldownTimer()
  }
}

watch(resetEmail, (val) => syncCooldownFromLimiter(val))
syncCooldownFromLimiter(resetEmail.value)

const resetButtonLabel = computed(() => {
  if (resetLoading.value) return 'Sending…'
  if (cooldownRemaining.value > 0) return `Resend in ${cooldownRemaining.value}s`
  return 'Send Reset Link'
})

onUnmounted(() => {
  stopCooldownTimer()
})


function friendlyError(code) {
  const map = {
    'auth/user-not-found':         'No account found with that email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/too-many-requests':      'Too many attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user':   'Google sign-in was cancelled.',
    'auth/invalid-credential':     'Incorrect email or password.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}

function redirectAfterLogin() {
  const dest = route.query.redirect
  router.push(dest && dest !== '/login' ? dest : '/dashboard')
}

async function handleEmail() {
  if (!email.value || !password.value || loading.value) return
  errorMsg.value = ''
  loading.value  = true
  try {
    await loginWithEmail(email.value, password.value)
    redirectAfterLogin()
  } catch (err) {
    errorMsg.value = friendlyError(err.code)
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  if (loading.value) return
  errorMsg.value = ''
  loading.value  = true
  try {
    await loginWithGoogle()
    redirectAfterLogin()
  } catch (err) {
    errorMsg.value = friendlyError(err.code)
  } finally {
    loading.value = false
  }
}

async function handleReset() {
  if (!resetEmail.value || resetLoading.value || cooldownRemaining.value > 0) return
  resetMsg.value     = ''
  resetError.value   = false

  // Cap reset requests per email to prevent spamming a user's inbox.
  // Persisted to localStorage (see rateLimiter.js) so refreshing the page
  // can't be used to bypass the cap.
  const key = resetKeyFor(resetEmail.value)
  const { allowed, resetAt } = checkRateLimit(key, {
    windowMs: RESET_WINDOW_MS,
    maxAttempts: RESET_MAX_ATTEMPTS,
  })
  if (!allowed) {
    resetError.value = true
    resetMsg.value   = `Too many reset requests. Try again in ${formatResetTime(resetAt)}.`
    startCooldown(resetAt)
    return
  }

  resetLoading.value = true
  try {
    const { isGoogleOnly } = await resetPassword(resetEmail.value)
    if (isGoogleOnly) {
      // Only fires when Firebase actually confirms it (i.e. Email
      // Enumeration Protection is off for this project) — see useAuth.js.
      resetMsg.value = "This email is registered through Google Sign-In. We still sent a reset link — completing it will let you sign in with a password too, in addition to Google."
    } else {
      // We usually can't confirm sign-in method client-side (Firebase's
      // Email Enumeration Protection hides it by default), so this stays
      // deliberately vague and always includes the Google hint.
      resetMsg.value = "If this email has an account, a reset link is on its way — check your inbox (and spam). Signed up with Google? You can keep using \"Continue with Google\"."
    }
    startCooldown(Date.now() + RESEND_COOLDOWN_MS)
  } catch (err) {
    // Firebase intentionally returns success-shaped behavior for unknown
    // emails on some configs; still map known error codes if they surface.
    resetError.value = true
    resetMsg.value   = friendlyError(err.code)
  } finally {
    resetLoading.value = false
  }
}
</script>