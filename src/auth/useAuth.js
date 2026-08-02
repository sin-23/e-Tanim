// src/auth/useAuth.js
import { ref, computed }       from 'vue'
import { auth, db }            from '@/firebase'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
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
          const batch = [
            set(dbRef(db, `users/${user.uid}/email`),       user.email ?? ''),
            set(dbRef(db, `users/${user.uid}/displayName`), user.displayName ?? user.email ?? ''),
            set(dbRef(db, `users/${user.uid}/lastLogin`),   Date.now()),
          ]
          if (user.photoURL) {
            batch.push(set(dbRef(db, `users/${user.uid}/photoURL`), user.photoURL))
          }
          await Promise.all(batch)
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

  async function loginWithGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider())
  }

  async function logout() {
    loggingOut.value = true
    try {
      await signOut(auth)
    } finally {
      loggingOut.value = false
    }
  }

  // Best-effort lookup of how an email is registered. Note: if "Email
  // Enumeration Protection" is enabled on the Firebase project (default for
  // newer projects), this always returns [] regardless of the real account
  // state — in that case we just can't know, and fall through to the normal
  // reset flow. When it *does* return data, it lets us catch the "this
  // account only has Google sign-in" case up front.
  async function getSignInMethods(email) {
    try {
      return await fetchSignInMethodsForEmail(auth, email)
    } catch {
      return []
    }
  }

  async function resetPassword(email) {
    const methods = await getSignInMethods(email)
    const isGoogleOnly = methods.length > 0 && !methods.includes('password')

    // sendPasswordResetEmail only sends mail for accounts that already have
    // (or can accept) a password credential. For a Google-only account it
    // silently no-ops on the Firebase side — but as long as the project has
    // Email/Password sign-in enabled in the console, sending the reset
    // email still works, and completing it *adds* a password credential to
    // that account (so the user can then sign in either way). We still
    // attempt the send either way; isGoogleOnly is just used to give the
    // user an accurate heads-up in the UI.
    await sendPasswordResetEmail(auth, email)
    return { isGoogleOnly }
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
    loginWithGoogle,
    logout,
    resetPassword,
    getSignInMethods,
    changePassword,
    verifyResetCode,
    confirmReset,
  }
}