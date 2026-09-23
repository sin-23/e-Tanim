<template>
  <article
    class="rounded-xl border p-4 transition-colors"
    :class="ready ? 'bg-garden-good/10 border-garden-good/40' : 'bg-garden-base border-garden-border'"
  >
    <div class="flex items-center justify-between gap-2 mb-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="text-lg">{{ detection.emoji }}</span>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-garden-text truncate">{{ detection.label }}</div>
          <div class="text-[10px] text-garden-dim capitalize">{{ detection.climate }} zone</div>
        </div>
      </div>
      <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0" :class="badge.classes">
        {{ badge.text }}
      </span>
    </div>

    <div v-if="detection.loading" class="h-14 rounded-xl bg-garden-border animate-pulse" />

    <template v-else>
      <div class="grid grid-cols-3 gap-2">
        <div v-for="s in stages" :key="s.key" class="rounded-lg border p-2 text-center" :class="s.box">
          <div class="text-lg font-medium leading-none" :class="unavailable ? 'text-garden-dim' : s.text">
            {{ unavailable ? '—' : detection[s.key] }}
          </div>
          <div class="text-[10px] text-garden-dim mt-1">{{ s.label }}</div>
        </div>
      </div>

      <p class="mt-2 text-[10px]" :class="detection.stale ? 'text-garden-warn font-medium' : 'text-garden-dim'">
        <template v-if="detection.error">{{ detection.error }}</template>
        <template v-else-if="detection.stale">No update for over 45 minutes. Last: {{ lastUpdated }}</template>
        <template v-else>
          Updated {{ lastUpdated }}<span v-if="detection.confidence !== null"> · confidence {{ Math.round(detection.confidence * 100) }}%</span>
        </template>
      </p>
    </template>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  detection: { type: Object, required: true },
})

const unavailable = computed(() => props.detection.loading || !!props.detection.error)
const ready = computed(() => !unavailable.value && props.detection.ripe > 0)

const stages = [
  { key: 'underripe', label: 'Underripe', box: 'bg-garden-surface border-garden-border', text: 'text-garden-warn' },
  { key: 'ripe',      label: 'Ripe',      box: 'bg-garden-surface border-garden-border', text: 'text-garden-good' },
  { key: 'damaged',   label: 'Damaged',   box: 'bg-garden-surface border-garden-border', text: 'text-garden-danger' },
]

const badge = computed(() => {
  const d = props.detection
  if (d.loading) return { text: 'SYNCING',  classes: 'bg-garden-base text-garden-dim border-garden-border' }
  if (d.error)   return { text: 'NO DATA',  classes: 'bg-garden-base text-garden-dim border-garden-border' }
  if (d.stale)   return { text: 'STALE',    classes: 'bg-garden-warn/15 text-garden-warn border-garden-warn/40' }
  if (d.ripe > 0) return { text: 'READY TO HARVEST', classes: 'bg-garden-good/15 text-garden-good border-garden-good/40' }
  return { text: 'NOT READY', classes: 'bg-garden-base text-garden-dim border-garden-border' }
})

const lastUpdated = computed(() => {
  const t = props.detection.updatedAt
  if (!t) return '—'
  const d = new Date(t)
  const time = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString()
    ? `${time} today`
    : `${time}, ${d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`
})
</script>