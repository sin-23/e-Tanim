import { ref, computed } from 'vue'

export const currentUser = ref(null)
export const authLoading = ref(false)
export const loggingOut = ref(false)

export function initAuth() {
  return Promise.resolve()
}

export function useAuth() {
  const isLoggedIn = computed(() => false)

  async function loginWithEmail() {
    throw new Error('Authentication is disabled in this build.')
  }

  async function loginWithGoogle() {
    throw new Error('Authentication is disabled in this build.')
  }

  async function logout() {
    loggingOut.value = false
    return Promise.resolve()
  }

  async function resetPassword() {
    return { isGoogleOnly: false }
  }

  async function getSignInMethods() {
    return []
  }

  async function changePassword() {
    throw new Error('Authentication is disabled in this build.')
  }

  async function verifyResetCode() {
    throw new Error('Authentication is disabled in this build.')
  }

  async function confirmReset() {
    throw new Error('Authentication is disabled in this build.')
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