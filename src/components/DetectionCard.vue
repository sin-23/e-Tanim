<template>
  <div
    class="bg-garden-card rounded-2xl border border-garden-border shadow-sm overflow-hidden"
  >
    <!-- Card header with total count on the right -->
    <div class="px-5 py-4 border-b border-garden-border">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="text-2xl">{{ crop.emoji }}</span>
          <div>
            <div class="font-extrabold text-base text-garden-text">{{ crop.label }}</div>
          </div>
        </div>

        <!-- Total detections -->
        <div class="text-right flex-shrink-0">
          <template v-if="crop.loading">
            <div class="h-6 w-8 rounded bg-garden-border animate-pulse ml-auto" />
          </template>
          <template v-else>
            <div class="text-2xl font-extrabold font-mono" :class="cropAccent[crop.id].text">
              {{ crop.error ? '—' : counts(crop).total }}
            </div>
          </template>
          <div class="text-[9px] font-extrabold uppercase tracking-widest text-garden-dim">
            Detections
          </div>
        </div>
      </div>
    </div>

    <div v-if="crop.loading" class="p-4 grid grid-cols-3 gap-3">
      <div v-for="i in 3" :key="i" class="h-20 rounded-2xl bg-garden-border animate-pulse" />
    </div>

    <template v-else>
      <p v-if="crop.error" class="px-5 py-3 text-xs text-garden-dim">{{ crop.error }}</p>

      <!-- 3 count boxes: Underripe, Ripe, Damaged -->
      <div class="p-4 grid grid-cols-3 gap-3">
        <div class="rounded-2xl border p-4 text-center bg-[#fef9c3] text-[#854d0e] border-[#fde047] dark:bg-[#3a330f] dark:text-[#fde047] dark:border-[#7a6a1f]">
          <div class="text-[9px] font-extrabold uppercase tracking-widest opacity-75">Underripe</div>
          <div class="text-3xl font-extrabold font-mono mt-1">{{ crop.underripe }}</div>
        </div>

        <div class="rounded-2xl border p-4 text-center bg-[#dcfce7] text-[#15803d] border-[#86efac] dark:bg-[#123a20] dark:text-[#86efac] dark:border-[#1e6b3a]">
          <div class="text-[9px] font-extrabold uppercase tracking-widest opacity-75">Ripe</div>
          <div class="text-3xl font-extrabold font-mono mt-1">{{ crop.ripe }}</div>
        </div>

        <div class="rounded-2xl border p-4 text-center bg-[#fee2e2] text-[#991b1b] border-[#fca5a5] dark:bg-[#3a1414] dark:text-[#fca5a5] dark:border-[#7a2828]">
          <div class="text-[9px] font-extrabold uppercase tracking-widest opacity-75">Damaged</div>
          <div class="text-3xl font-extrabold font-mono mt-1">{{ crop.damaged }}</div>
        </div>
      </div>

      <!-- Last update / confidence -->
      <p
        class="px-5 text-[10px]"
        :class="[
          showFruitLog ? 'pb-1' : 'pb-4',
          crop.stale ? 'text-garden-warn font-semibold' : 'text-garden-dim'
        ]"
      >
      </p>

      <!-- Per-fruit detection rows: not available with the current data model yet
           (Firebase currently stores aggregate counts per crop, not individual
           fruit IDs/frames — see decision log item 44). Placeholder shown instead
           of inventing fruit data. -->
      <div v-if="showFruitLog" class="px-4 pb-4 pt-2">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-garden-base border border-dashed border-garden-border">
          <span class="text-garden-dim">
            <CameraIconSvg />
          </span>
          <div class="text-[11px] text-garden-dim">
            Per-fruit detection log isn't available yet.
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'

const props = defineProps({
  detection: { type: Object, required: true },
  // The Crop Monitor page shows the per-fruit log area; the Dashboard hides it.
  showFruitLog: { type: Boolean, default: true },
})
const crop = computed(() => props.detection)

// Per-crop accent colors, matching the Figma design (tomato / eggplant / bell pepper).
const cropAccent = {
  tomato:      { text: 'text-[#dc2626]' },
  eggplant:    { text: 'text-[#7c3aed]' },
  bell_pepper: { text: 'text-garden-primary' },
}

function counts(crop) {
  return { total: crop.underripe + crop.ripe + crop.damaged }
}

function lastUpdated(crop) {
  const t = crop.updatedAt
  if (!t) return '—'
  const d = new Date(t)
  const time = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString()
    ? `${time} today`
    : `${time}, ${d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`
}

const CameraIconSvg = () => h('svg', {
  width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
}, [
  h('path', { d: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' }),
  h('circle', { cx: 12, cy: 13, r: 4 }),
])
</script>