import { createRouter, createWebHistory } from 'vue-router'
import { ref } from 'vue'

export const isNavigating = ref(false)

const routes = [
  { path: '/', redirect: '/dashboard' },

  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
  },

  {
    path: '/irrigation',
    name: 'irrigation',
    component: () => import('@/views/IrrigationView.vue'),
  },

  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
  },

  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(() => {
  isNavigating.value = true
})

router.afterEach(() => { isNavigating.value = false })
router.onError(() => { isNavigating.value = false })

export default router