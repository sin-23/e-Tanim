import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initAuth } from './auth/useAuth'
import { isConfigured } from './firebase'
import { initDarkMode } from './composables/useDarkMode'
import { initTempUnit } from './composables/useTempUnit'

async function bootstrap() {
  initDarkMode()
  initTempUnit()

  const app = createApp(App)
  app.use(router)

  if (isConfigured) {
    // Block render until Firebase Auth fires its first state change.
    // Prevents the login page from flashing for already-logged-in users.
    // Never wait forever: if Firebase is unreachable the app still renders.
    await Promise.race([initAuth(), new Promise(r => setTimeout(r, 10000))])
  }

  app.mount('#app')
}

bootstrap()