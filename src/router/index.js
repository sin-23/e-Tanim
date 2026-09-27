import { createRouter, createWebHistory } from 'vue-router'
import { ref } from 'vue'

export const isNavigating = ref(false)

const routes = [
  { path: '/', redirect: '/dashboard' },

  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: 'Dashboard' },
  },

  {
    path: '/irrigation',
    name: 'irrigation',
    component: () => import('@/views/IrrigationView.vue'),
    meta: { title: 'Irrigation & Fertilization' },
  },

  {
    path: '/reservoir',
    name: 'reservoir',
    component: () => import('@/views/ReservoirView.vue'),
    meta: { title: 'Reservoir Levels' },
  },

  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: 'Settings' },
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