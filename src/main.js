// src/main.js
import { createApp }    from 'vue'
import './style.css'
import App              from './App.vue'
import router           from './router'
import { initAuth }     from './auth/useAuth'
import { isConfigured } from './firebase'

async function bootstrap() {
  const app = createApp(App)
  app.use(router)

  if (isConfigured) {
    // Block render until Firebase Auth fires its first state change.
    // Prevents the login page from flashing for already-logged-in users.
    await initAuth()
  }

  app.mount('#app')
}

bootstrap()
