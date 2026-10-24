<template>
  <div class="p-4 lg:p-6 pb-12 max-w-2xl mx-auto space-y-5">

    <div class="mb-2">
      <h1 class="text-xl font-extrabold text-garden-text">Settings</h1>
      <p class="text-sm text-garden-dim mt-0.5">Your account and display preferences for the e-Tanim dashboard.</p>
    </div>

    <!-- ══════════════════════════════════════════════════════
         Account
         ══════════════════════════════════════════════════════ -->
    <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden transition-colors duration-200">
      <div class="px-5 pt-5 pb-4 border-b border-garden-border flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-garden-base flex items-center justify-center text-lg flex-shrink-0">🔐</div>
        <div>
          <div class="text-sm font-extrabold text-garden-text">Account</div>
          <div class="text-[0.6875rem] text-garden-dim mt-0.5 font-medium">Change the password or email you sign in with.</div>
        </div>
      </div>

      <div class="p-5 space-y-5">

        <!-- Signed in as -->
        <div>
          <div class="text-xs font-bold text-garden-text mb-1">Signed in as</div>
          <div class="font-mono text-sm text-garden-dim break-all">{{ currentUser?.email }}</div>
        </div>

        <div class="h-px bg-garden-border" />

        <!-- Change password -->
        <div class="space-y-3">
          <div class="text-sm font-bold text-garden-text">Change Password</div>

          <div>
            <label class="block text-xs font-medium text-garden-text mb-1.5">Current Password</label>
            <input
              v-model="pwCurrent"
              :type="pwShow ? 'text' : 'password'"
              autocomplete="current-password"
              :class="inputCls"
              @blur="pwTouched.current = true"
            />
            <p v-if="pwTouched.current && pwCurrentError" class="mt-1 text-xs text-garden-danger">{{ pwCurrentError }}</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-garden-text mb-1.5">New Password</label>
            <input
              v-model="pwNew"
              :type="pwShow ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="At least 8 characters"
              :class="inputCls"
              @blur="pwTouched.next = true"
            />
            <p v-if="pwTouched.next && pwNewError" class="mt-1 text-xs text-garden-danger">{{ pwNewError }}</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-garden-text mb-1.5">Confirm New Password</label>
            <input
              v-model="pwConfirm"
              :type="pwShow ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Re-enter new password"
              :class="inputCls"
              @blur="pwTouched.confirm = true"
              @keydown.enter="submitPassword"
            />
            <p v-if="pwTouched.confirm && pwConfirmError" class="mt-1 text-xs text-garden-danger">{{ pwConfirmError }}</p>
          </div>

          <label class="flex items-center gap-2 text-[0.6875rem] text-garden-dim cursor-pointer select-none">
            <input v-model="pwShow" type="checkbox" class="accent-[#2d7a4f]" />
            Show passwords
          </label>

          <p v-if="pwError" class="text-xs text-garden-danger">{{ pwError }}</p>
          <p v-if="pwSuccess" class="text-xs font-semibold text-garden-primary">{{ pwSuccess }}</p>

          <button
            class="w-full py-2.5 rounded-xl font-bold text-sm transition-colors disabled:cursor-not-allowed"
            :class="pwSubmitting ? 'bg-garden-base text-garden-dim opacity-70' : 'bg-garden-primary text-white'"
            :disabled="pwSubmitting"
            @click="submitPassword"
          >
            {{ pwSubmitting ? 'Updating…' : 'Update Password' }}
          </button>
        </div>

        <div class="h-px bg-garden-border" />

        <!-- Change email -->
        <div class="space-y-3">
          <div>
            <div class="text-sm font-bold text-garden-text">Change Email</div>
            <p class="text-[0.6875rem] text-garden-dim mt-0.5">
              We send a verification link to the new address. Your email only changes after you open it.
            </p>
          </div>

          <div>
            <label class="block text-xs font-medium text-garden-text mb-1.5">New Email</label>
            <input
              v-model="emNew"
              type="email"
              autocomplete="email"
              placeholder="new@example.com"
              :class="inputCls"
              @blur="emTouched.email = true"
            />
            <p v-if="emTouched.email && emNewError" class="mt-1 text-xs text-garden-danger">{{ emNewError }}</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-garden-text mb-1.5">Current Password</label>
            <input
              v-model="emPassword"
              type="password"
              autocomplete="current-password"
              :class="inputCls"
              @blur="emTouched.password = true"
              @keydown.enter="submitEmail"
            />
            <p v-if="emTouched.password && emPasswordError" class="mt-1 text-xs text-garden-danger">{{ emPasswordError }}</p>
          </div>

          <p v-if="emError" class="text-xs text-garden-danger">{{ emError }}</p>
          <p v-if="emSuccess" class="text-xs font-semibold text-garden-primary">{{ emSuccess }}</p>

          <button
            class="w-full py-2.5 rounded-xl font-bold text-sm transition-colors disabled:cursor-not-allowed"
            :class="emSubmitting ? 'bg-garden-base text-garden-dim opacity-70' : 'bg-garden-primary text-white'"
            :disabled="emSubmitting"
            @click="submitEmail"
          >
            {{ emSubmitting ? 'Sending…' : 'Send Verification Link' }}
          </button>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         Display Preferences
         ══════════════════════════════════════════════════════ -->
    <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden transition-colors duration-200">
      <div class="px-5 pt-5 pb-4 border-b border-garden-border flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-garden-base flex items-center justify-center text-lg flex-shrink-0">🎨</div>
        <div>
          <div class="text-sm font-extrabold text-garden-text">Display Preferences</div>
          <div class="text-[0.6875rem] text-garden-dim mt-0.5 font-medium">Adjust how data and the interface appear.</div>
        </div>
      </div>

      <div class="p-5 space-y-5">

        <!-- Dark mode -->
        <div>
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-sm font-bold text-garden-text">Dark Mode</div>
              <div class="text-[0.6875rem] text-garden-dim mt-0.5">Switch to a dark green palette suited for low-light use.</div>
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
          <p class="text-[0.6875rem] text-garden-dim mt-2">
            Displayed values are converted from raw °C stored by the sensors.<span v-if="unit === 'F'"> Stored data remains in °C.</span>
          </p>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         About
         ══════════════════════════════════════════════════════ -->
    <div class="px-5 py-4 rounded-2xl border border-garden-border bg-garden-surface flex items-center justify-between transition-colors duration-200">
      <div>
        <div class="text-xs font-bold text-garden-text">e-Tanim System</div>
        <div class="font-mono text-[0.625rem] text-garden-dim mt-0.5">v2.4.1 · Off-grid IoT · ESP32 + Mini PC</div>
      </div>
      <span class="text-[0.625rem] font-semibold text-garden-dim bg-garden-base px-2 py-1 rounded-full">
        Lowland + Highland
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'
import { useTempUnit } from '@/composables/useTempUnit'
import { useAuth } from '@/auth/useAuth'

const { isDarkMode, toggleDarkMode } = useDarkMode()

// Temperature unit is a shared, localStorage-persisted preference (see
// useTempUnit) so every view converts the same way. It only affects how
// Celsius sensor readings are displayed — thresholds and Firebase/ESP32
// data stay in Celsius.
const { tempUnit: unit, setTempUnit } = useTempUnit()

// ── Account ───────────────────────────────────────────────────────────────────
const { currentUser, changePassword, changeEmail } = useAuth()

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-garden-border bg-garden-surface text-sm font-semibold ' +
  'text-garden-text placeholder:text-garden-dim/50 focus:outline-none focus:ring-2 ' +
  'focus:border-garden-primary focus:ring-[#2d7a4f]/15 transition-all'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function friendlyAuthError(code) {
  const map = {
    'auth/wrong-password':                      'Current password is incorrect.',
    'auth/invalid-credential':                  'Current password is incorrect.',
    'auth/weak-password':                       'New password is too weak. Use at least 8 characters.',
    'auth/password-does-not-meet-requirements': 'Password does not meet the project\'s password policy (try upper/lowercase, a number and a symbol).',
    'auth/too-many-requests':                   'Too many attempts. Wait a few minutes and try again.',
    'auth/requires-recent-login':               'Please sign out and sign in again, then retry.',
    'auth/no-current-user':                     'You are not signed in.',
    'auth/invalid-email':                       'That email address is not valid.',
    'auth/email-already-in-use':                'That email is already used by another account.',
    'auth/operation-not-allowed':               'Email changes are not enabled in Firebase (Authentication → Sign-in method).',
    'auth/unauthorized-continue-uri':           'This domain isn\'t authorized in Firebase (Authentication → Settings → Authorized domains).',
    'auth/network-request-failed':              'Network error. Check your connection.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}

// ── Change password ──
const pwCurrent    = ref('')
const pwNew        = ref('')
const pwConfirm    = ref('')
const pwShow       = ref(false)
const pwTouched    = ref({ current: false, next: false, confirm: false })
const pwSubmitting = ref(false)
const pwError      = ref('')
const pwSuccess    = ref('')

const pwCurrentError = computed(() => (pwCurrent.value ? '' : 'Enter your current password'))
const pwNewError = computed(() => {
  if (!pwNew.value) return 'New password is required'
  if (pwNew.value.length < 8) return 'At least 8 characters'
  if (pwNew.value === pwCurrent.value) return 'Must be different from the current password'
  return ''
})
const pwConfirmError = computed(() => {
  if (!pwConfirm.value) return 'Please confirm the new password'
  if (pwConfirm.value !== pwNew.value) return 'Passwords do not match'
  return ''
})

async function submitPassword() {
  pwTouched.value = { current: true, next: true, confirm: true }
  pwError.value   = ''
  pwSuccess.value = ''
  if (pwCurrentError.value || pwNewError.value || pwConfirmError.value || pwSubmitting.value) return

  pwSubmitting.value = true
  try {
    await changePassword(pwCurrent.value, pwNew.value)
    pwSuccess.value = 'Password updated.'
    pwCurrent.value = pwNew.value = pwConfirm.value = ''
    pwTouched.value = { current: false, next: false, confirm: false }
  } catch (err) {
    pwError.value = friendlyAuthError(err.code)
  } finally {
    pwSubmitting.value = false
  }
}

// ── Change email ──
const emNew        = ref('')
const emPassword   = ref('')
const emTouched    = ref({ email: false, password: false })
const emSubmitting = ref(false)
const emError      = ref('')
const emSuccess    = ref('')

const emNewError = computed(() => {
  const v = emNew.value.trim()
  if (!v) return 'New email is required'
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address'
  if (v.toLowerCase() === (currentUser.value?.email ?? '').toLowerCase()) return 'That is already your email'
  return ''
})
const emPasswordError = computed(() => (emPassword.value ? '' : 'Enter your current password'))

async function submitEmail() {
  emTouched.value = { email: true, password: true }
  emError.value   = ''
  emSuccess.value = ''
  if (emNewError.value || emPasswordError.value || emSubmitting.value) return

  emSubmitting.value = true
  const target = emNew.value.trim()
  try {
    await changeEmail(emPassword.value, target)
    emSuccess.value = `Verification link sent to ${target}. Open it to finish the change, then sign in with the new email.`
    emNew.value = emPassword.value = ''
    emTouched.value = { email: false, password: false }
  } catch (err) {
    emError.value = friendlyAuthError(err.code)
  } finally {
    emSubmitting.value = false
  }
}
</script>