// src/utils/chartColors.js
// Chart.js draws on a canvas, so it cannot use Tailwind classes. Read the garden-* color
// variables at draw time so the charts follow light and dark mode.
export function cssColor(name, alpha = 1) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--garden-${name}`).trim()
  return v ? `rgb(${v} / ${alpha})` : '#888'
}