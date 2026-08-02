// src/composables/useTempUnit.js
//
// Display-only temperature unit preference. All sensor data, thresholds,
// and Firebase/ESP32 values stay in Celsius — that's the raw hardware unit
// and what the automation logic compares against. Converting before storage
// would mean rewriting every threshold, the ESP32 firmware's comparisons,
// and the historical logs whenever a user flips a UI toggle. Instead we keep
// a single Celsius source of truth and convert only at the moment of display,
// the same way useDarkMode keeps one shared preference for every component.
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'etanim-temp-unit'

function getInitial() {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'F' ? 'F' : 'C'
}

// Singleton so every component reads/writes the same preference.
export const tempUnit = ref('C')
let initialized = false

export function initTempUnit() {
  if (initialized) return
  initialized = true

  tempUnit.value = getInitial()

  watch(tempUnit, (value) => {
    localStorage.setItem(STORAGE_KEY, value)
  })
}

/** Raw Celsius value -> the number to show, given the current preference. */
export function celsiusToDisplay(celsius, decimals = 1) {
  if (celsius === null || celsius === undefined || Number.isNaN(celsius)) return null
  const value = tempUnit.value === 'F' ? (celsius * 9) / 5 + 32 : celsius
  return +value.toFixed(decimals)
}

/** A value already in the display unit -> Celsius, for saving back to Firebase/ESP32. */
export function displayToCelsius(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return value
  return tempUnit.value === 'F' ? ((value - 32) * 5) / 9 : value
}

export function useTempUnit() {
  const unitLabel = computed(() => (tempUnit.value === 'F' ? '°F' : '°C'))

  function setTempUnit(value) {
    tempUnit.value = value === 'F' ? 'F' : 'C'
  }

  return { tempUnit, unitLabel, setTempUnit, celsiusToDisplay, displayToCelsius }
}