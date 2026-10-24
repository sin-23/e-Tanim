// src/auth/useAuth.js
import { ref, computed }       from 'vue'
import { auth, db }            from '@/firebase'
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
} from 'firebase/auth'
import { ref as dbRef, set, get } from 'firebase/database'

// ── Singleton state ───────────────────────────────────────────────────────────
export const currentUser = ref(null)
export const authLoading = ref(true)
// True from the moment logout() is called until signOut() settles. Exists so
// the router guard can treat the session as "over" immediately, instead of
// racing onAuthStateChanged's async update — without this, navigating to
// /login right after calling logout() gets bounced back to /dashboard by the
// requiresGuest check, since currentUser hasn't gone null yet.
export const loggingOut = ref(false)

let _authReadyPromise = null

// ── One-time initializer — call in main.js ────────────────────────────────────
export function initAuth() {
  if (_authReadyPromise) return _authReadyPromise

  _authReadyPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser.value = user

        try {
          await Promise.all([
            set(dbRef(db, `users/${user.uid}/email`),       user.email ?? ''),
            set(dbRef(db, `users/${user.uid}/displayName`), user.displayName ?? user.email ?? ''),
            set(dbRef(db, `users/${user.uid}/lastLogin`),   Date.now()),
          ])
        } catch {
          // Ignore errors
        }
      } else {
        currentUser.value = null
      }

      authLoading.value = false
      resolve()
    })
  })

  return _authReadyPromise
}

// ── Composable ────────────────────────────────────────────────────────────────
export function useAuth() {
  const isLoggedIn = computed(() => !!currentUser.value && !loggingOut.value)

  async function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    loggingOut.value = true
    try {
      await signOut(auth)
    } finally {
      loggingOut.value = false
    }
  }

  // Sends the password-reset email. continueUrl: Firebase's hosted reset page
  // shows a "Continue" button that returns the user to our login page once
  // the password is changed. (The project's custom action URL can't be set,
  // because Firebase rejects the update with EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED,
  // so the hosted page is used.) The origin must be listed under
  // Authentication → Settings → Authorized domains (localhost is there by
  // default).
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`,
      handleCodeInApp: false,
    })
  }

  // Requires the user's current password since changing credentials is a
  // sensitive operation Firebase gates behind a recent sign-in. Throws with
  // Firebase's error codes (e.g. 'auth/wrong-password') on failure so the
  // caller can show a specific message.
  async function changePassword(currentPassword, newPassword) {
    const user = auth.currentUser
    if (!user || !user.email) {
      const err = new Error('auth/no-current-user')
      err.code = 'auth/no-current-user'
      throw err
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword)
  }

  // Starts an email change. Re-authenticates with the current password, then
  // sends a verification link to the NEW address. The account's email only
  // changes once that link is opened, so a typo can't lock the user out.
  // (updateEmail() is deliberately not used: it changes the address at once
  // without verification, and Firebase blocks it when email-enumeration
  // protection is on.) Throws Firebase error codes like changePassword does.
  async function changeEmail(currentPassword, newEmail) {
    const user = auth.currentUser
    if (!user || !user.email) {
      const err = new Error('auth/no-current-user')
      err.code = 'auth/no-current-user'
      throw err
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await verifyBeforeUpdateEmail(user, newEmail, {
      url: `${window.location.origin}/login`,
      handleCodeInApp: false,
    })
  }

  // Verifies the oobCode from the reset-password email link and returns the
  // account's email if valid. Throws (e.g. 'auth/expired-action-code',
  // 'auth/invalid-action-code') if the link is expired, already used, or
  // malformed — the reset-password page uses this to show an error state
  // before ever showing the "set new password" form.
  async function verifyResetCode(oobCode) {
    return verifyPasswordResetCode(auth, oobCode)
  }

  // Completes the reset: sets newPassword on the account tied to oobCode.
  async function confirmReset(oobCode, newPassword) {
    return confirmPasswordReset(auth, oobCode, newPassword)
  }

  return {
    currentUser,
    authLoading,
    loggingOut,
    isLoggedIn,
    loginWithEmail,
    logout,
    resetPassword,
    changePassword,
    changeEmail,
    verifyResetCode,
    confirmReset,
  }
}