import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initDarkMode } from './composables/useDarkMode'
import { initTempUnit } from './composables/useTempUnit'

function bootstrap() {
  initDarkMode()
  initTempUnit()

  const app = createApp(App)
  app.use(router)
  app.mount('#app')
}

bootstrap()