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
          <div class="w-10 h-10 rounded-xl bg-garden-primary flex items-center justify-center">
            <span class="text-lg">🌱</span>
          </div>
          <div>
            <div class="text-xl font-bold text-white tracking-tight">e-Tanim</div>
            <div class="text-[0.625rem] font-semibold tracking-widest uppercase text-white/40">AI · IoT · Crop Management</div>
          </div>
        </div>

        <!-- Hero text -->
        <div class="flex-1 flex flex-col justify-center max-w-sm">
          <h1 class="text-4xl font-bold text-white leading-tight mb-4">
            AI-Assisted Integrated<br />
            <span style="color: #4ade80">Crop Management System</span>
          </h1>
          <p class="text-sm text-white/50 font-medium leading-relaxed mb-8">
            Monitor sensor readings, automate irrigation, fertilization, and misting, and get AI-powered harvest detection, all from one dashboard.
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
          <div class="text-[0.625rem] font-semibold tracking-widest uppercase text-garden-dim">AI · IoT · Crop Management</div>
        </div>
      </div>

      <div class="w-full max-w-sm">

        <!-- ── Forgot password sub-view ─────────────────────────── -->
        <template v-if="showForgot">
          <button
            class="text-xs font-semibold text-garden-dim flex items-center gap-1 hover:text-garden-text transition-colors mb-6"
            @click="showForgot = false"
          >
            ← Back to Sign In
          </button>

          <div class="mb-6">
            <h2 class="text-2xl font-semibold text-garden-text mb-1.5">Reset Password</h2>
            <p class="text-sm text-garden-dim font-medium">Enter your email and we'll send a reset link.</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-garden-text mb-1.5">Email address</label>
              <input
                v-model="resetEmail"
                type="email"
                placeholder="you@etanim.ph"
                class="w-full px-4 py-3 rounded-xl border border-garden-border bg-garden-surface text-sm font-semibold
                       text-garden-text placeholder:text-garden-dim/50 focus:outline-none focus:border-garden-primary
                       focus:ring-2 focus:ring-[#2d7a4f]/15 transition-all"
                @keydown.enter="handleReset"
              />
            </div>

            <p v-if="resetMsg" class="text-xs font-semibold" :class="resetError ? 'text-garden-danger' : 'text-garden-good'">
              {{ resetMsg }}
            </p>

            <button
              class="w-full py-3 rounded-xl bg-garden-primary text-white font-medium text-sm
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
            <h2 class="text-2xl font-semibold text-garden-text mb-1.5">Welcome back</h2>
            <p class="text-sm text-garden-dim font-medium">Sign in to your garden dashboard</p>
          </div>

          <form class="space-y-4" novalidate @submit.prevent="handleEmail">

            <!-- Email -->
            <div>
              <label class="block text-xs font-medium text-garden-text mb-1.5">Email address</label>
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="you@etanim.ph"
                class="w-full px-4 py-3 rounded-xl border border-garden-border bg-garden-surface text-sm font-semibold
                       text-garden-text placeholder:text-garden-dim/50 focus:outline-none focus:border-garden-primary
                       focus:ring-2 focus:ring-[#2d7a4f]/15 transition-all"
              />
            </div>

            <!-- Password -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-medium text-garden-text">Password</label>
                <button
                  type="button"
                  class="text-xs font-semibold text-garden-primary hover:text-garden-primary/80 transition-colors"
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
                  class="w-full px-4 py-3 pr-11 rounded-xl border border-garden-border bg-garden-surface text-sm font-semibold
                         text-garden-text placeholder:text-garden-dim/50 focus:outline-none focus:border-garden-primary
                         focus:ring-2 focus:ring-[#2d7a4f]/15 transition-all"
                />
                <button
                  type="button"
                  tabindex="-1"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-garden-dim hover:text-garden-primary transition-colors p-1"
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
            <div v-if="errorMsg" class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-garden-danger/10 border border-garden-danger/40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span class="text-xs font-semibold text-garden-danger">{{ errorMsg }}</span>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading || !email || !password"
              class="w-full py-3 rounded-xl bg-garden-primary text-white font-medium text-sm
                     hover:bg-[#246040] active:bg-[#1d5035] transition-colors shadow-sm
                     disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              <svg v-if="loading" class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              {{ loading ? 'Signing in…' : 'Sign In' }}
            </button>
          </form>

          <!-- Register link -->
          <p class="text-center text-[0.6875rem] text-garden-dim mt-6">
            Don't have an account?
            <router-link to="/register" class="font-semibold text-garden-primary hover:underline">Create account →</router-link>
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
const { loginWithEmail, resetPassword, currentUser } = useAuth()

// signInWith*() promises can resolve slightly before Firebase's
// onAuthStateChanged listener (in useAuth.js) actually updates
// `currentUser` — IndexedDB persistence writes add a small delay on the
// first sign-in. Without waiting for that, redirectAfterLogin() pushes to
// /dashboard while the router guard still sees currentUser as null, gets
// bounced to /login, and only "arrives" once currentUser catches up —
// which looks like the app stalled before loading. Waiting here keeps the
// spinner running through that gap instead.
function waitForCurrentUser(timeoutMs = 5000) {
  if (currentUser.value) return Promise.resolve()
  return new Promise((resolve) => {
    const stop = watch(currentUser, (user) => {
      if (user) { stop(); resolve() }
    })
    setTimeout(() => { stop(); resolve() }, timeoutMs)
  })
}

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
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/quota-exceeded':         'Email sending quota exceeded for this project. Try again later.',
    'auth/unauthorized-continue-uri': 'This domain isn\'t authorized in Firebase (Authentication → Settings → Authorized domains).',
    'auth/operation-not-allowed':  'Email/Password sign-in isn\'t enabled for this project (Authentication → Sign-in method).',
    'auth/user-disabled':          'This account has been disabled.',
    'auth/internal-error':        'Firebase reported an internal error. Check the console for details.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}

function redirectAfterLogin() {
  const dest = route.query.redirect
  router.push(dest && dest !== '/login' ? dest : '/dashboard')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function handleEmail() {
  if (loading.value) return
  errorMsg.value = ''
  if (!email.value.trim()) { errorMsg.value = 'Please enter your email address.'; return }
  if (!EMAIL_RE.test(email.value.trim())) {
    errorMsg.value = 'That doesn\'t look like an email address. Use the format name@example.com.'
    return
  }
  if (!password.value) { errorMsg.value = 'Please enter your password.'; return }
  loading.value  = true
  try {
    await loginWithEmail(email.value, password.value)
    await waitForCurrentUser()
    redirectAfterLogin()
  } catch (err) {
    errorMsg.value = friendlyError(err.code)
  } finally {
    loading.value = false
  }
}

async function handleReset() {
  if (resetLoading.value || cooldownRemaining.value > 0) return
  resetMsg.value     = ''
  resetError.value   = false
  if (!EMAIL_RE.test(resetEmail.value.trim())) {
    resetError.value = true
    resetMsg.value   = resetEmail.value.trim()
      ? 'That doesn\'t look like an email address. Use the format name@example.com.'
      : 'Please enter your email address.'
    return
  }

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
    await resetPassword(resetEmail.value)
    // Deliberately vague: Firebase's Email Enumeration Protection hides
    // whether the address has an account.
    resetMsg.value = "If this email has an account, a reset link is on its way. Check your inbox (and spam)."
    startCooldown(Date.now() + RESEND_COOLDOWN_MS)
  } catch (err) {
    // Firebase intentionally returns success-shaped behavior for unknown
    // emails on some configs; still map known error codes if they surface.
    // Logged so the real Firebase error code/message is visible in devtools
    // instead of only the generic user-facing text below.
    console.error('resetPassword failed:', err.code, err.message)
    resetError.value = true
    resetMsg.value   = friendlyError(err.code)
  } finally {
    resetLoading.value = false
  }
}
</script>