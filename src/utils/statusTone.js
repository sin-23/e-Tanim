// src/utils/statusTone.js
//
// One place that decides what each color MEANS on the dashboard.
//
//   good    green   normal, running, sufficient, ripe
//   warn    orange  needs attention soon, out of range, stale data
//   danger  red     locked out, critical, damaged, error
//   info    blue    neutral information only (never a status)
//   neutral grey    off, idle, standby, no data
//
// Components pick a tone and read classes from TONE instead of choosing
// colors themselves. Class names are written out in full so Tailwind can
// find them.

export const TONE = {
  good: {
    text:   'text-garden-good-ink',
    tint:   'bg-garden-good/10',
    border: 'border-garden-good/40',
    pill:   'bg-garden-good/15 text-garden-good-ink border-garden-good/40',
    dot:    'bg-garden-good',
    cssVar: 'rgb(var(--garden-good))',
  },
  warn: {
    text:   'text-garden-warn-ink',
    tint:   'bg-garden-warn/10',
    border: 'border-garden-warn/50',
    pill:   'bg-garden-warn/15 text-garden-warn-ink border-garden-warn/50',
    dot:    'bg-garden-warn',
    cssVar: 'rgb(var(--garden-warn))',
  },
  danger: {
    text:   'text-garden-danger-ink',
    tint:   'bg-garden-danger/10',
    border: 'border-garden-danger/40',
    pill:   'bg-garden-danger/15 text-garden-danger-ink border-garden-danger/40',
    dot:    'bg-garden-danger',
    cssVar: 'rgb(var(--garden-danger))',
  },
  info: {
    text:   'text-garden-info-ink',
    tint:   'bg-garden-info/10',
    border: 'border-garden-info/40',
    pill:   'bg-garden-info/15 text-garden-info-ink border-garden-info/40',
    dot:    'bg-garden-info',
    cssVar: 'rgb(var(--garden-info))',
  },
  neutral: {
    text:   'text-garden-dim',
    tint:   'bg-garden-base',
    border: 'border-garden-border',
    pill:   'bg-garden-base text-garden-dim border-garden-border',
    dot:    'bg-garden-dim',
    cssVar: 'rgb(var(--garden-dim))',
  },
}

export const toneOf = (tone) => TONE[tone] ?? TONE.neutral

const RANK = { neutral: 0, good: 1, info: 1, warn: 2, danger: 3 }

/** The most severe of several tones (used for a zone's overall status). */
export function worstTone(tones) {
  return tones.reduce((worst, t) => (RANK[t] ?? 0) > (RANK[worst] ?? 0) ? t : worst, 'neutral')
}

/**
 * Tone for a sensor reading against its normal band { low, high }.
 *   inside the band                     -> good
 *   outside by up to 15% of the band    -> warn
 *   outside by more than that           -> danger
 *   no reading                          -> neutral
 */
export function bandTone(value, band, margin = 0.15) {
  if (typeof value !== 'number' || !band) return 'neutral'
  const span = band.high - band.low
  if (value >= band.low && value <= band.high) return 'good'
  const off = value < band.low ? band.low - value : value - band.high
  return off <= span * margin ? 'warn' : 'danger'
}

/** Short word shown next to a reading so status never relies on color alone. */
export function bandWord(value, band) {
  if (typeof value !== 'number' || !band) return 'No data'
  if (value < band.low) return 'Low'
  if (value > band.high) return 'High'
  return 'Normal'
}