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

      <!-- ── Success state ────────────────────────────────────── -->
      <div
        v-if="success"
        class="w-full max-w-sm rounded-2xl p-8 text-center space-y-4 border bg-white"
        style="border-color: #d8e8de; box-shadow: 0 8px 40px rgba(45,122,79,0.08)"
      >
        <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto border"
             style="background: rgba(45,122,79,0.08); border-color: rgba(45,122,79,0.25)">
          ✓
        </div>
        <div>
          <h2 class="text-xl font-semibold text-[#1a2e22] mb-1">Account Created</h2>
          <p class="text-sm text-[#6b8070]">You're logged in and ready to use the dashboard.</p>
        </div>
        <p class="text-xs font-mono text-[#9bb5aa]">Redirecting to dashboard…</p>
        <div class="h-1 w-full rounded-full overflow-hidden bg-[#d8e8de]">
          <div class="h-full rounded-full bg-[#2d7a4f]" style="animation: progress 2.2s ease-in-out forwards" />
        </div>
      </div>

      <!-- ── Registration form ────────────────────────────────── -->
      <div v-else class="w-full max-w-sm">
        <div class="mb-8">
          <h2 class="text-2xl font-semibold text-[#1a2e22] mb-1.5">Create Account</h2>
          <p class="text-sm font-medium text-[#6b8070]">Sensor Dashboard · e-Tanim</p>
        </div>

        <!-- Google -->
        <button
          class="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[#d8e8de]
                 bg-white text-[#1a2e22] font-medium text-sm hover:bg-[#eef3f0] hover:border-[#2d7a4f]/40
                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-5"
          :disabled="loading"
          @click="handleGoogle"
        >
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        <!-- Divider -->
        <div class="flex items-center gap-3 mb-5">
          <div class="flex-1 h-px bg-[#d8e8de]" />
          <span class="text-[10px] font-semibold text-[#6b8070] uppercase tracking-widest">or</span>
          <div class="flex-1 h-px bg-[#d8e8de]" />
        </div>

        <!-- Fields -->
        <div class="space-y-3">

          <!-- Display name -->
          <div>
            <label class="block text-xs font-medium text-[#1a2e22] mb-1.5">Display Name</label>
            <input
              v-model="displayName"
              type="text"
              autocomplete="name"
              placeholder="Your name"
              maxlength="64"
              class="w-full px-4 py-3 rounded-xl border bg-white text-sm font-semibold
                     text-[#1a2e22] placeholder:text-[#b0bfb8] focus:outline-none
                     focus:ring-2 transition-all"
              :class="fieldBorderClass(v$.displayName)"
              @blur="v$.displayName.$touch()"
            />
            <p v-if="v$.displayName.$error" class="mt-1 text-xs text-[#dc2626]">
              {{ v$.displayName.$errors[0].$message }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-medium text-[#1a2e22] mb-1.5">Email</label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              class="w-full px-4 py-3 rounded-xl border bg-white text-sm font-semibold
                     text-[#1a2e22] placeholder:text-[#b0bfb8] focus:outline-none
                     focus:ring-2 transition-all"
              :class="fieldBorderClass(v$.email)"
              @blur="v$.email.$touch()"
            />
            <p v-if="v$.email.$error" class="mt-1 text-xs text-[#dc2626]">
              {{ v$.email.$errors[0].$message }}
            </p>
          </div>

          <!-- Password with strength meter -->
          <div>
            <label class="block text-xs font-medium text-[#1a2e22] mb-1.5">Password</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="At least 8 characters"
                class="w-full px-4 py-3 pr-14 rounded-xl border bg-white text-sm font-semibold
                       text-[#1a2e22] placeholder:text-[#b0bfb8] focus:outline-none
                       focus:ring-2 transition-all"
                :class="fieldBorderClass(v$.password)"
                @blur="v$.password.$touch()"
              />
              <button
                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium
                       text-[#6b8070] hover:text-[#1a2e22] transition-colors"
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
                :style="{ background: (password && n <= passwordStrength) ? STRENGTH_COLORS[passwordStrength] : '#d8e8de' }"
              />
            </div>
            <p v-if="password" class="mt-1 text-[10px] font-mono" :style="{ color: STRENGTH_COLORS[passwordStrength] }">
              {{ strengthLabel }}
            </p>

            <p v-if="v$.password.$error" class="mt-1 text-xs text-[#dc2626]">
              {{ v$.password.$errors[0].$message }}
            </p>
          </div>

          <!-- Confirm password -->
          <div>
            <label class="block text-xs font-medium text-[#1a2e22] mb-1.5">Confirm Password</label>
            <input
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Re-enter password"
              class="w-full px-4 py-3 rounded-xl border bg-white text-sm font-semibold
                     text-[#1a2e22] placeholder:text-[#b0bfb8] focus:outline-none
                     focus:ring-2 transition-all"
              :class="fieldBorderClass(v$.confirmPassword)"
              @blur="v$.confirmPassword.$touch()"
              @keydown.enter="handleRegister"
            />
            <p v-if="v$.confirmPassword.$error" class="mt-1 text-xs text-[#dc2626]">
              {{ v$.confirmPassword.$errors[0].$message }}
            </p>
          </div>
        </div>

        <!-- Server error -->
        <p v-if="serverError" class="mt-3 text-xs text-[#dc2626]">{{ serverError }}</p>

        <!-- Submit -->
        <button
          class="w-full py-3 rounded-xl text-white font-medium text-sm transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed mt-5"
          :style="loading ? { background: '#d8e8de', color: '#6b8070' } : { background: '#1a2e22', color: '#fff' }"
          :disabled="loading || v$.$invalid"
          @click="handleRegister"
        >
          {{ loading ? 'Creating account…' : 'Create Account' }}
        </button>

        <!-- Sign in link -->
        <p class="text-center text-[11px] text-[#6b8070] mt-6">
          Already have an account?
          <router-link to="/login" class="font-semibold text-[#2d7a4f] hover:underline">Sign in</router-link>
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
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
}                         from 'firebase/auth'
import { ref as dbRef, set } from 'firebase/database'

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
    return 'border-[#d8e8de] focus:border-[#2d7a4f] focus:ring-[#2d7a4f]/15'
  if (field.$error)
    return 'border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]/15'
  return 'border-[#2d7a4f]/50 focus:border-[#2d7a4f] focus:ring-[#2d7a4f]/15'
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
    'auth/popup-closed-by-user':   'Google sign-up was cancelled.',
    'auth/operation-not-allowed':  'Email/password sign-up is not enabled.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}

function redirectAfterRegister() {
  router.push('/dashboard')
}

// ── Handlers ───────────────────────────────────────────────────────────────────
async function handleRegister() {
  v$.value.$touch()
  if (v$.value.$invalid || loading.value) return

  serverError.value = ''
  loading.value = true
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.value, password.value)

    await updateProfile(cred.user, { displayName: displayName.value.trim() })

    await set(dbRef(db, `users/${cred.user.uid}`), {
      email:       cred.user.email ?? '',
      displayName: displayName.value.trim(),
      createdAt:   Date.now(),
      lastLogin:   Date.now(),
    })

    success.value = true
    setTimeout(redirectAfterRegister, 2200)
  } catch (err) {
    serverError.value = friendlyError(err.code)
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  if (loading.value) return
  serverError.value = ''
  loading.value = true
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())

    await set(dbRef(db, `users/${cred.user.uid}`), {
      email:       cred.user.email ?? '',
      displayName: cred.user.displayName ?? cred.user.email ?? '',
      photoURL:    cred.user.photoURL ?? '',
      createdAt:   Date.now(),
      lastLogin:   Date.now(),
    })

    success.value = true
    setTimeout(redirectAfterRegister, 2200)
  } catch (err) {
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