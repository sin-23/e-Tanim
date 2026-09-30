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
    path: '/crop-monitor',
    name: 'crop-monitor',
    component: () => import('@/views/CropMonitorView.vue'),
    meta: { title: 'Crop Monitor' },
  },

  {
    path: '/irrigation',
    name: 'irrigation',
    component: () => import('@/views/IrrigationView.vue'),
    meta: { title: 'Irrigation, Fertilization, & Misting' },
  },

  {
    path: '/reservoir',
    name: 'reservoir',
    component: () => import('@/views/ReservoirView.vue'),
    meta: { title: 'Reservoir Levels' },
  },

  {
    path: '/activity-log',
    name: 'activity-log',
    component: () => import('@/views/ActivityLogView.vue'),
    meta: { title: 'Activity Log' },
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