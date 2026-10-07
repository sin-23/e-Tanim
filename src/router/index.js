import { createRouter, createWebHistory } from 'vue-router'
import { watch, ref } from 'vue'
import { currentUser, authLoading, loggingOut } from '@/auth/useAuth'

// True while a navigation is in flight (auth check and/or lazy chunk fetch).
// App.vue shows a loading bar off this.
export const isNavigating = ref(false)

const routes = [
  { path: '/', redirect: '/dashboard' },

  // ── Public auth pages ──────────────────────────────────────────────
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true, title: 'Sign In' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresGuest: true, title: 'Create Account' },
  },
  {
    // Firebase's password-reset email link points here (set in Firebase
    // Console → Authentication → Templates → Password reset → Customize
    // action URL). Not guest-only: the link works regardless of session.
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: { title: 'Reset Password' },
  },

  // ── Protected app pages ────────────────────────────────────────────
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true, title: 'Dashboard' },
  },
  {
    path: '/crop-monitor',
    name: 'crop-monitor',
    component: () => import('@/views/CropMonitorView.vue'),
    meta: { requiresAuth: true, title: 'Crop Monitor' },
  },
  {
    path: '/irrigation',
    name: 'irrigation',
    component: () => import('@/views/IrrigationView.vue'),
    meta: { requiresAuth: true, title: 'Irrigation, Fertilization, & Misting' },
  },
  {
    path: '/reservoir',
    name: 'reservoir',
    component: () => import('@/views/ReservoirView.vue'),
    meta: { requiresAuth: true, title: 'Reservoir Levels' },
  },
  {
    path: '/activity-log',
    name: 'activity-log',
    component: () => import('@/views/ActivityLogView.vue'),
    meta: { requiresAuth: true, title: 'Activity Log' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true, title: 'Settings' },
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
    return {
      name: 'login',
      query: to.fullPath !== '/dashboard' ? { redirect: to.fullPath } : undefined,
    }
  }
})

router.afterEach(() => { isNavigating.value = false })
router.onError(() => { isNavigating.value = false })

export default router