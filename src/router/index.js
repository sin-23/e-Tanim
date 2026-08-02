// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { watch, ref }                     from 'vue'
import { currentUser, authLoading, loggingOut } from '@/auth/useAuth'

// True while a navigation is in flight — covers both waiting on the auth
// guard AND fetching a not-yet-loaded route chunk (e.g. LoginView.vue on
// first navigation there). App.vue shows a loading indicator off this so a
// slow chunk fetch or auth check reads as "loading" instead of the previous
// page just sitting there for a beat before the swap happens.
export const isNavigating = ref(false)

const routes = [
  { path: '/', redirect: '/dashboard' },

  {
    path:      '/login',
    name:      'login',
    component: () => import('@/views/LoginView.vue'),
    meta:      { requiresGuest: true },
  },

  {
    path:      '/register',
    name:      'register',
    component: () => import('@/views/RegisterView.vue'),
    meta:      { requiresGuest: true },
  },

  {
    // Firebase's password-reset action link points here (see
    // Authentication → Templates → Password reset → "Customize action URL"
    // in the console) instead of the default firebaseapp.com page, so the
    // reset flow matches e-Tanim's design instead of looking like Google's
    // generic, phishing-suspicious action-handler page.
    path:      '/reset-password',
    name:      'reset-password',
    component: () => import('@/views/ResetPasswordView.vue'),
  },

  {
    path:      '/dashboard',
    name:      'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta:      { requiresAuth: true },
  },

  {
    path:      '/irrigation',
    name:      'irrigation',
    component: () => import('@/views/IrrigationView.vue'),
    meta:      { requiresAuth: true },
  },

  {
    path:      '/settings',
    name:      'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta:      { requiresAuth: true },
  },

  {
    path:      '/admin',
    name:      'admin',
    component: () => import('@/views/AdminView.vue'),
    meta:      { requiresAuth: true },
  },

  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

function waitForAuth() {
  if (!authLoading.value) return Promise.resolve()
  return new Promise((resolve) => {
    const stop = watch(authLoading, (loading) => {
      if (!loading) { stop(); resolve() }
    })
  })
}

router.beforeEach(async (to) => {
  isNavigating.value = true
  await waitForAuth()

  const authed = !!currentUser.value && !loggingOut.value

  if (to.meta.requiresGuest && authed) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresAuth && !authed) {
    return { name: 'login', query: to.fullPath !== '/dashboard' ? { redirect: to.fullPath } : undefined }
  }
})

router.afterEach(() => { isNavigating.value = false })
router.onError(()  => { isNavigating.value = false })

export default router