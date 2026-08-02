// src/composables/useDarkMode.js
import { ref, watch } from 'vue'

const STORAGE_KEY = 'etanim-dark-mode'

function getInitial() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'true')  return true
  if (stored === 'false') return false
  // No saved preference yet — fall back to the OS/browser preference.
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

// Singleton so every component sharing this composable reads/writes the
// same state instead of each keeping its own out-of-sync copy.
export const isDarkMode = ref(false)
let initialized = false

function apply(value) {
  document.documentElement.classList.toggle('dark', value)
}

export function initDarkMode() {
  if (initialized) return
  initialized = true

  isDarkMode.value = getInitial()
  apply(isDarkMode.value)

  watch(isDarkMode, (value) => {
    apply(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  })
}

export function useDarkMode() {
  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
  }
  function setDarkMode(value) {
    isDarkMode.value = value
  }
  return { isDarkMode, toggleDarkMode, setDarkMode }
}