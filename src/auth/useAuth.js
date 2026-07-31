// src/auth/useAuth.js
import { ref, computed }       from 'vue'
import { auth, db }            from '@/firebase'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth'
import { ref as dbRef, set, get } from 'firebase/database'

// ── Singleton state ───────────────────────────────────────────────────────────
export const currentUser = ref(null)
export const authLoading = ref(true)

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
  const isLoggedIn = computed(() => !!currentUser.value)

  async function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function loginWithGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider())
  }

  async function logout() {
    return signOut(auth)
  }

  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  return {
    currentUser,
    authLoading,
    isLoggedIn,
    loginWithEmail,
    loginWithGoogle,
    logout,
    resetPassword,
  }
}
