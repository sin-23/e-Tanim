<template>
  <div :class="embedded ? 'space-y-3' : 'p-4 lg:p-6 space-y-5 pb-12'">
    <!-- Header + filter (when embedded in the Dashboard, the card and title come from the Dashboard) -->
    <div :class="embedded ? '' : 'bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4'">
      <!-- Filter chips + event count on the same row -->
      <div class="flex items-center gap-2 flex-wrap">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-garden-dim flex-shrink-0">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>

        <button
          v-for="f in FILTER_TYPES"
          :key="f.id"
          @click="filter = f.id; page = 1"
          class="px-3 py-1 rounded-full text-xs font-bold transition-colors"
          :class="filter === f.id
            ? 'bg-garden-primary text-white'
            : 'bg-garden-base text-garden-dim hover:bg-garden-border'"
        >
          {{ f.label }}
        </button>

        <!-- Count + reset, pushed to the right end of the filter row -->
        <div v-if="!embedded" class="flex items-center gap-2 ml-auto">
          <span class="text-[10px] text-garden-dim font-semibold whitespace-nowrap">
            {{ filtered.length }} event{{ filtered.length !== 1 ? 's' : '' }}
          </span>
          <button
            @click="page = 1"
            class="p-1.5 rounded-lg hover:bg-garden-base text-garden-dim hover:text-garden-primary transition-colors"
            title="Reset"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="!activityLogLoaded" class="space-y-2">
      <div v-for="i in 6" :key="i" class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl bg-garden-base animate-pulse flex-shrink-0" />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-3 w-2/3 rounded bg-garden-base animate-pulse" />
            <div class="h-2.5 w-1/3 rounded bg-garden-base animate-pulse" />
          </div>
        </div>
      </div>
    </div>

    <!-- Log entries grouped by date -->
    <div v-else class="space-y-5">
      <div v-for="[date, entries] in grouped" :key="date">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-extrabold text-garden-dim uppercase tracking-widest">{{ date }}</span>
          <div class="flex-1 h-px bg-garden-border" />
          <span class="text-[10px] font-semibold text-garden-dim bg-garden-base px-2 py-0.5 rounded-full">
            {{ entries.length }} event{{ entries.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="entry in entries"
            :key="entry.id"
            class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-lg border"
                :class="EVENT_STYLE[entry.eventType].cls"
              >{{ EVENT_STYLE[entry.eventType].icon }}</div>

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2 flex-wrap">
                  <div class="text-sm text-garden-text leading-snug">{{ entry.message }}</div>

                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span
                      class="text-[9px] px-2 py-0.5 rounded-full"
                      :class="entry.isManual ? MANUAL_TAG_CLS : AUTO_TAG_CLS"
                    >{{ entry.isManual ? '🖐️ Manual' : '⚙️ Auto' }}</span>

                    <span class="text-[10px] font-mono text-garden-dim">
                      {{ formatLogTime(entry.timestamp) }}
                    </span>
                  </div>
                </div>

                <div v-if="entry.by" class="text-[11px] text-garden-dim mt-1 font-medium">by {{ entry.by }}</div>

                <div class="flex items-center gap-1.5 mt-2">
                  <span
                    class="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                    :class="EVENT_STYLE[entry.eventType].cls"
                  >{{ typeLabel(entry.eventType) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filtered.length === 0" class="flex flex-col items-center gap-3 py-16 text-garden-dim">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-30">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span class="text-sm font-semibold">
          {{ activityLog.length === 0 ? 'No activity yet — manual overrides, timer shutoffs, threshold changes, and schedule changes will appear here as they happen.' : 'No events found for this filter' }}
        </span>
      </div>

      <!-- Load more -->
      <div v-if="hasMore && !embedded" class="flex justify-center">
        <button
          @click="page++"
          class="px-6 py-3 rounded-2xl bg-garden-surface border border-garden-border text-sm font-bold text-garden-primary hover:bg-garden-base transition-colors shadow-sm"
        >
          Load more ({{ filtered.length - paginated.length }} remaining)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useActivityFeed } from '@/composables/useActivityLog'

// `embedded` = the compact version shown inside the Dashboard's Activity Log card.
const props = defineProps({
  embedded: { type: Boolean, default: false },
})

// Same shared Firestore feed the Dashboard widget uses, just with a much
// higher limit since this is the dedicated full-history page.
const { entries: activityLog, loaded: activityLogLoaded } = useActivityFeed(props.embedded ? 25 : 500)


const FILTER_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'irrigation', label: 'Irrigation' },
  { id: 'fertilization', label: 'Fertilization' },
  { id: 'misting', label: 'Misting' },
  { id: 'detection', label: 'Detections' },
  { id: 'reservoir', label: 'Reservoir' },
]

// Tailwind classes (bg + text + border) with dark: variants, so the tags follow dark mode.
const EVENT_STYLE = {
  irrigation:    { icon: '💧', cls: 'bg-[#eff8ff] text-[#1d4ed8] border-[#93c5fd] dark:bg-[#12263f] dark:text-[#93c5fd] dark:border-[#1e4a7a]' },
  fertilization: { icon: '⚗️', cls: 'bg-[#f5ede6] text-[#92400e] border-[#fcd9bd] dark:bg-[#33241a] dark:text-[#fcd9bd] dark:border-[#6b4a30]' },
  misting:       { icon: '☁️', cls: 'bg-[#e6f4fb] text-[#0369a1] border-[#7dd3fc] dark:bg-[#0f2a38] dark:text-[#7dd3fc] dark:border-[#1e5a78]' },
  detection:     { icon: '📷', cls: 'bg-[#dcfce7] text-[#15803d] border-[#86efac] dark:bg-[#123a20] dark:text-[#86efac] dark:border-[#1e6b3a]' },
  reservoir:     { icon: '🛢️', cls: 'bg-[#e0f2fe] text-[#0369a1] border-[#7dd3fc] dark:bg-[#10283a] dark:text-[#7dd3fc] dark:border-[#1e5a78]' },
  other:         { icon: '⚙️', cls: 'bg-garden-base text-garden-dim border-garden-border' },
}

const MANUAL_TAG_CLS = 'bg-[#fef9c3] text-[#854d0e] border border-[#fde047] dark:bg-[#3a330f] dark:text-[#fde047] dark:border-[#7a6a1f]'
const AUTO_TAG_CLS = 'bg-garden-base text-garden-dim border border-garden-border'

// Uses the explicit `category` / `manual` fields when present; falls back to
// guessing from the message for older entries.
function classifyEntry(e) {
  const msg = (e.message || '').toLowerCase()
  let eventType = EVENT_STYLE[e.category] ? e.category : 'other'
  if (eventType === 'other') {
    if (msg.includes('misting')) eventType = 'misting'
    else if (msg.includes('fertiliz')) eventType = 'fertilization'
    else if (msg.includes('irrigation')) eventType = 'irrigation'
    else if (msg.includes('reservoir')) eventType = 'reservoir'
    else if (msg.includes('detect')) eventType = 'detection'
  }
  const isManual = e.manual !== undefined
    ? e.manual
    : msg.includes('manually') || msg.includes('schedule updated') || msg.includes('thresholds updated') || msg.includes('threshold set to')
  return { ...e, eventType, isManual }
}

function typeLabel(type) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function formatLogTime(timestamp) {
  const d = new Date(timestamp)
  const isToday = d.toDateString() === new Date().toDateString()
  const time = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return isToday ? `${time} today` : `${time}, ${d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`
}

const PAGE_SIZE = props.embedded ? 25 : 8
const page = ref(1)
const filter = ref('all')

const classified = computed(() => activityLog.value.map(classifyEntry))

const filtered = computed(() => {
  if (filter.value === 'all') return classified.value
  return classified.value.filter((e) => e.eventType === filter.value)
})

const paginated = computed(() => filtered.value.slice(0, page.value * PAGE_SIZE))
const hasMore = computed(() => paginated.value.length < filtered.value.length)

const grouped = computed(() => {
  const map = new Map()
  for (const entry of paginated.value) {
    const d = new Date(entry.timestamp)
    const dateLabel = d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    if (!map.has(dateLabel)) map.set(dateLabel, [])
    map.get(dateLabel).push(entry)
  }
  return map
})
</script>