<template>
  <div class="min-h-screen flex">

    <!-- ── Left panel: branding (identical to LoginView) ───────── -->
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

      <!-- ── Success state ────────────────────────────────────── -->
      <div
        v-if="success"
        class="w-full max-w-sm rounded-2xl p-8 text-center space-y-4 border bg-garden-surface"
        style="border-color: rgb(var(--garden-border)); box-shadow: 0 8px 40px rgba(45,122,79,0.08)"
      >
        <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto border"
             style="background: rgba(45,122,79,0.08); border-color: rgba(45,122,79,0.25)">
          ✓
        </div>
        <div>
          <h2 class="text-xl font-semibold text-garden-text mb-1">Account Created</h2>
          <p class="text-sm text-garden-dim">You're logged in and ready to use the dashboard.</p>
        </div>
        <p class="text-xs font-mono text-garden-dim">Redirecting to dashboard…</p>
        <div class="h-1 w-full rounded-full overflow-hidden bg-garden-border">
          <div class="h-full rounded-full bg-garden-primary" style="animation: progress 2.2s ease-in-out forwards" />
        </div>
      </div>

      <!-- ── Device access gate (scan or enter the unit's code first) ── -->
      <DeviceAccessGate v-else-if="!deviceVerified" @verified="onDeviceVerified" />

      <!-- ── Registration form ────────────────────────────────── -->
      <div v-else class="w-full max-w-sm">
        <div class="mb-8">
          <button
            class="text-xs font-semibold text-garden-dim flex items-center gap-1 hover:text-garden-text transition-colors mb-4"
            @click="deviceVerified = false"
          >
            ← Back
          </button>
          <h2 class="text-2xl font-semibold text-garden-text mb-1.5">Create Account</h2>
          <p class="text-sm font-medium text-garden-dim">
            Sensor Dashboard · e-Tanim
            <span class="block mt-1 font-mono text-[0.6875rem] text-garden-primary">Unit: {{ deviceSystemId }}</span>
          </p>
        </div>

        <!-- Fields -->
        <div class="space-y-3">

          <!-- Display name -->
          <div>
            <label class="block text-xs font-medium text-garden-text mb-1.5">Display Name</label>
            <input
              v-model="displayName"
              type="text"
              autocomplete="name"
              placeholder="Your name"
              maxlength="64"
              class="w-full px-4 py-3 rounded-xl border bg-garden-surface text-sm font-semibold
                     text-garden-text placeholder:text-garden-dim/50 focus:outline-none
                     focus:ring-2 transition-all"
              :class="fieldBorderClass(v$.displayName)"
              @blur="v$.displayName.$touch()"
            />
            <p v-if="v$.displayName.$error" class="mt-1 text-xs text-garden-danger">
              {{ v$.displayName.$errors[0].$message }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-medium text-garden-text mb-1.5">Email</label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              class="w-full px-4 py-3 rounded-xl border bg-garden-surface text-sm font-semibold
                     text-garden-text placeholder:text-garden-dim/50 focus:outline-none
                     focus:ring-2 transition-all"
              :class="fieldBorderClass(v$.email)"
              @blur="v$.email.$touch()"
            />
            <p v-if="v$.email.$error" class="mt-1 text-xs text-garden-danger">
              {{ v$.email.$errors[0].$message }}
            </p>
          </div>

          <!-- Password with strength meter -->
          <div>
            <label class="block text-xs font-medium text-garden-text mb-1.5">Password</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="At least 8 characters"
                class="w-full px-4 py-3 pr-14 rounded-xl border bg-garden-surface text-sm font-semibold
                       text-garden-text placeholder:text-garden-dim/50 focus:outline-none
                       focus:ring-2 transition-all"
                :class="fieldBorderClass(v$.password)"
                @blur="v$.password.$touch()"
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
            <p v-if="password" class="mt-1 text-[0.625rem] font-mono" :style="{ color: STRENGTH_COLORS[passwordStrength] }">
              {{ strengthLabel }}
            </p>

            <p v-if="v$.password.$error" class="mt-1 text-xs text-garden-danger">
              {{ v$.password.$errors[0].$message }}
            </p>
          </div>

          <!-- Confirm password -->
          <div>
            <label class="block text-xs font-medium text-garden-text mb-1.5">Confirm Password</label>
            <input
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Re-enter password"
              class="w-full px-4 py-3 rounded-xl border bg-garden-surface text-sm font-semibold
                     text-garden-text placeholder:text-garden-dim/50 focus:outline-none
                     focus:ring-2 transition-all"
              :class="fieldBorderClass(v$.confirmPassword)"
              @blur="v$.confirmPassword.$touch()"
              @keydown.enter="handleRegister"
            />
            <p v-if="v$.confirmPassword.$error" class="mt-1 text-xs text-garden-danger">
              {{ v$.confirmPassword.$errors[0].$message }}
            </p>
          </div>
        </div>

        <!-- Server error -->
        <p v-if="serverError" class="mt-3 text-xs text-garden-danger">{{ serverError }}</p>

        <!-- Submit -->
        <button
          class="w-full py-3 rounded-xl font-medium text-sm transition-colors
                 disabled:cursor-not-allowed mt-5"
          :class="loading
            ? 'bg-garden-base text-garden-dim opacity-70'
            : 'bg-garden-text text-garden-void'"
          :disabled="loading"
          @click="handleRegister"
        >
          {{ loading ? 'Creating account…' : 'Create Account' }}
        </button>

        <!-- Sign in link -->
        <p class="text-center text-[0.6875rem] text-garden-dim mt-6">
          Already have an account?
          <router-link to="/login" class="font-semibold text-garden-primary hover:underline">Sign in</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter }      from 'vue-router'
import { useVuelidate }   from '@vuelidate/core'
import {
  required,
  email as emailValidator,
  minLength,
  helpers,
}                         from '@vuelidate/validators'
import { auth, db }       from '@/firebase'
import {
  createUserWithEmailAndPassword,
  updateProfile,
}                         from 'firebase/auth'
import { ref as dbRef, set } from 'firebase/database'
import DeviceAccessGate      from '@/components/DeviceAccessGate.vue'
import { joinDeviceBySystemCode } from '@/auth/useDeviceAccessCode'

const router = useRouter()

// ── Form state ────────────────────────────────────────────────────────────────
const displayName     = ref('')
const email           = ref('')
const password        = ref('')
const confirmPassword = ref('')
const showPassword    = ref(false)
const loading         = ref(false)
const serverError     = ref('')
const success          = ref(false)

// ── Device access gate ───────────────────────────────────────────────────────
// The form stays hidden until a valid, active device code has been scanned or
// typed. The code is reusable: several accounts can join the same unit.
const deviceVerified = ref(false)
const deviceCode     = ref('')
const deviceSystemId = ref('')

function onDeviceVerified({ code, systemId }) {
  deviceCode.value     = code
  deviceSystemId.value = systemId
  deviceVerified.value = true
}

// ── Vuelidate rules ───────────────────────────────────────────────────────────
const mustMatch = helpers.withMessage(
  'Passwords do not match',
  (value) => value === password.value
)

const rules = {
  displayName: {
    required:  helpers.withMessage('Display name is required', required),
    minLength: helpers.withMessage('At least 2 characters', minLength(2)),
  },
  email: {
    required: helpers.withMessage('Email is required', required),
    email:    helpers.withMessage('Enter a valid email', emailValidator),
  },
  password: {
    required:  helpers.withMessage('Password is required', required),
    minLength: helpers.withMessage('At least 8 characters', minLength(8)),
  },
  confirmPassword: {
    required:  helpers.withMessage('Please confirm your password', required),
    mustMatch,
  },
}

const v$ = useVuelidate(rules, { displayName, email, password, confirmPassword })

// ── Field border helper ───────────────────────────────────────────────────────
function fieldBorderClass(field) {
  if (!field.$dirty)
    return 'border-garden-border focus:border-garden-primary focus:ring-[#2d7a4f]/15'
  if (field.$error)
    return 'border-garden-danger focus:border-garden-danger focus:ring-garden-danger/15'
  return 'border-garden-primary/50 focus:border-garden-primary focus:ring-garden-primary/15'
}

// ── Password strength ─────────────────────────────────────────────────────────
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

const strengthLabel = computed(() => password.value ? STRENGTH_LABELS[passwordStrength.value] : '')

// ── Error messages ────────────────────────────────────────────────────────────
function friendlyError(code) {
  const map = {
    'auth/email-already-in-use':   'An account with that email already exists.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/weak-password':          'Password is too weak. Use at least 8 characters.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/operation-not-allowed':  'Email/Password sign-in is not enabled in Firebase (Authentication → Sign-in method).',
    'auth/admin-restricted-operation': 'Sign-up is disabled for this Firebase project (Authentication → Settings → User actions → enable "create").',
    'auth/password-does-not-meet-requirements': 'Password does not meet the project\'s password policy (try upper/lowercase, a number and a symbol).',
    'auth/unauthorized-domain':    'This domain isn\'t authorized in Firebase (Authentication → Settings → Authorized domains).',
    'auth/too-many-requests':      'Too many attempts. Try again later.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Invalid Firebase API key — check your .env values.',
  }
  return map[code] ?? `Something went wrong${code ? ` (${code})` : ''}. Please try again.`
}

function redirectAfterRegister() {
  router.push('/dashboard')
}

// ── Handlers ───────────────────────────────────────────────────────────────────
async function handleRegister() {
  v$.value.$touch()
  if (v$.value.$invalid || loading.value || !deviceVerified.value) return

  serverError.value = ''
  loading.value = true
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value)

    // The account now exists. Profile/database writes are best-effort so a
    // failure there can't be misreported as "sign-up failed" (which would
    // also make a retry hit "email already in use").
    try {
      await updateProfile(cred.user, { displayName: displayName.value.trim() })
    } catch (e) {
      console.error('updateProfile failed:', e)
    }
    try {
      await set(dbRef(db, `users/${cred.user.uid}`), {
        email:       cred.user.email ?? '',
        displayName: displayName.value.trim(),
        createdAt:   Date.now(),
        lastLogin:   Date.now(),
      })
    } catch (e) {
      console.error('Saving user record failed (check RTDB rules for /users):', e)
    }

    // Join the unit: adds this uid to deviceAccessCodes/{code}/members and
    // stores systemId + code on users/{uid}. Without this the account cannot
    // control the system, so a failure here is reported, not swallowed.
    try {
      await joinDeviceBySystemCode(deviceCode.value, cred.user.uid)
    } catch (e) {
      console.error('Joining the unit failed:', e)
      serverError.value = 'Your account was created, but it could not be linked to the unit (' +
        (e?.message ?? 'unknown error') + '). Sign in and contact the system owner.'
      return
    }

    success.value = true
    setTimeout(redirectAfterRegister, 2200)
  } catch (err) {
    console.error('Register failed:', err.code, err.message)
    serverError.value = friendlyError(err.code)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes progress {
  from { width: 0% }
  to   { width: 100% }
}
</style>