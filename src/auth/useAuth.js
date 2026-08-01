// src/auth/useAuth.js
import { ref, computed }       from 'vue'
import { auth, db }            from '@/firebase'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
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
  }
}