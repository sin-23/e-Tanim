<template>
  <!-- Desktop and tablet: one row per date, lowland and highland side by side -->
  <div class="hidden md:block rounded-2xl border border-garden-border bg-garden-surface overflow-hidden">
    <div class="overflow-auto max-h-[34rem]">
      <table class="w-full text-xs border-separate border-spacing-0 min-w-[64rem]">
        <thead>
          <tr class="h-8">
            <th rowspan="2" scope="col"
                class="sticky top-0 left-0 z-30 bg-garden-surface border-b border-garden-border px-3 text-left align-bottom pb-2 min-w-[9rem]">
              <button type="button" class="font-bold text-garden-dim hover:text-garden-text" @click="sortBy('date')">
                Date{{ arrow('date') }}
              </button>
            </th>
            <th v-for="g in groups" :key="g.key" colspan="2" scope="colgroup"
                class="sticky top-0 z-20 bg-garden-surface border-b border-garden-border px-3 text-center font-bold text-garden-text">
              {{ g.label }}
            </th>
          </tr>
          <tr class="h-8">
            <template v-for="g in groups" :key="g.key">
              <th v-for="z in ZONES" :key="z.id" scope="col"
                  class="sticky top-8 z-20 bg-garden-surface border-b border-garden-border px-3 text-center">
                <button type="button" class="font-bold text-[0.6875rem] text-garden-dim hover:text-garden-text"
                        @click="sortBy(`${g.key}.${z.id}`)">
                  {{ z.label }}{{ arrow(`${g.key}.${z.id}`) }}
                </button>
              </th>
            </template>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in pageRows" :key="r.date">
            <tr class="hover:bg-garden-base/50">
              <th scope="row" class="sticky left-0 z-10 bg-garden-surface border-b border-garden-border px-3 py-2.5 text-left font-bold text-garden-text">
                <button type="button" class="inline-flex items-center gap-1.5" :aria-expanded="isOpen(r.date)" @click="toggle(r.date)">
                  <span class="text-garden-dim transition-transform" :class="isOpen(r.date) ? 'rotate-90' : ''">▸</span>
                  {{ prettyDate(r.date) }}
                </button>
                <div class="text-[0.625rem] font-semibold text-garden-dim ml-4">Daily</div>
              </th>
              <template v-for="g in groups" :key="g.key">
                <td v-for="z in ZONES" :key="z.id" class="border-b border-garden-border px-3 py-2.5 text-center align-top">
                  <Cell :c="cell(r[z.id].daily, g.key, z.id)" />
                </td>
              </template>
            </tr>
            <template v-if="isOpen(r.date)">
              <tr v-for="p in PERIODS" :key="`${r.date}-${p.id}`" class="bg-garden-base/60">
                <th scope="row" class="sticky left-0 z-10 bg-garden-base border-b border-garden-border pl-9 pr-3 py-2 text-left font-semibold text-garden-dim">
                  {{ p.label }}
                </th>
                <template v-for="g in groups" :key="g.key">
                  <td v-for="z in ZONES" :key="z.id" class="border-b border-garden-border px-3 py-2 text-center align-top">
                    <Cell :c="cell(r[z.id][p.id], g.key, z.id)" />
                  </td>
                </template>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
    <TablePager v-model:page="page" v-model:perPage="perPage" :total="sortedRows.length" :pages="pages" noun="date" />
  </div>

  <!-- Phone: one card per date -->
  <div class="md:hidden space-y-3">
    <div v-for="r in pageRows" :key="r.date" class="rounded-2xl border border-garden-border bg-garden-surface p-3">
      <button type="button" class="w-full flex items-center justify-between font-bold text-sm text-garden-text"
              :aria-expanded="isOpen(r.date)" @click="toggle(r.date)">
        <span>{{ prettyDate(r.date) }} <span class="text-[0.625rem] font-semibold text-garden-dim">Daily</span></span>
        <span class="text-garden-dim">{{ isOpen(r.date) ? '▾' : '▸' }}</span>
      </button>
      <template v-for="part in cardParts(r)" :key="part.label">
        <div class="mt-3 text-[0.625rem] font-bold uppercase tracking-wide text-garden-dim">{{ part.label }}</div>
        <div class="mt-1 grid grid-cols-[5rem_1fr_1fr] gap-x-2 gap-y-1.5 text-xs">
          <div />
          <div class="font-bold text-garden-dim text-center">Lowland</div>
          <div class="font-bold text-garden-dim text-center">Highland</div>
          <template v-for="g in groups" :key="g.key">
            <div class="font-semibold text-garden-dim">{{ g.short }}</div>
            <div v-for="z in ZONES" :key="z.id" class="text-center"><Cell :c="cell(part.data[z.id], g.key, z.id)" /></div>
          </template>
        </div>
      </template>
    </div>
    <TablePager v-model:page="page" v-model:perPage="perPage" :total="sortedRows.length" :pages="pages" noun="date" />
  </div>
</template>

<script setup>
import { computed, h, ref, watch, defineComponent } from 'vue'
import TablePager from '@/components/TablePager.vue'
import { celsiusToDisplay, tempUnit } from '@/composables/useTempUnit'
import { ZONE_META, getSensorStatus } from '@/composables/useSensorData'

const props = defineProps({
  rows:       { type: Array, required: true },    // from useZonePeriodAverages, newest first
  thresholds: { type: Object, required: true },   // { lowland: { vpdGate }, highland: { vpdGate } }
})

const ZONES = [{ id: 'lowland', label: 'Lowland' }, { id: 'highland', label: 'Highland' }]
const PERIODS = [
  { id: 'morning', label: 'Morning' }, { id: 'afternoon', label: 'Afternoon' }, { id: 'night', label: 'Night' },
]
const groups = computed(() => [
  { key: 'soilMoisture', label: 'Soil moisture (%)',  short: 'Moisture', decimals: 1 },
  { key: 'temperature',  label: `Temp (°${tempUnit.value})`, short: 'Temp', decimals: 1 },
  { key: 'humidity',     label: 'Humidity (%)',       short: 'Humidity', decimals: 1 },
  { key: 'vpd',          label: 'VPD (kPa)',          short: 'VPD',      decimals: 2 },
  { key: 'samples',      label: 'Samples',            short: 'Samples',  decimals: 0 },
])

// Healthy bands come from ZONE_META (the same ones the zone cards use).
const bandOf = (zone, metric) => ZONE_META.find(m => m.id === zone)?.thresholds?.[metric === 'soilMoisture' ? 'moisture' : metric]

/** One table cell: { main, range, warn, flag }. Values arrive in the stored units (Celsius). */
function cell(d, metric, zone) {
  if (!d) return { main: '—' }
  if (metric === 'samples') return { main: String(d.sampleCount) }
  const g = groups.value.find(x => x.key === metric)
  // Fixed decimals so a column lines up ("27.0", not "27").
  const show = (v) => v === null || v === undefined ? '—'
    : (metric === 'temperature' ? celsiusToDisplay(v, 4) : v).toFixed(g.decimals)
  const band = bandOf(zone, metric)
  const warn = !!band && getSensorStatus(d[metric], band) !== 'ok'
  const flag = metric === 'vpd' && d.vpd < (props.thresholds[zone]?.vpdGate ?? 0.6)
  const lo = d.minimum?.[metric], hi = d.maximum?.[metric]
  return {
    main: show(d[metric]),
    range: lo != null && hi != null ? `${show(lo)}–${show(hi)}` : '',
    warn: warn || flag,
    flag,
  }
}

const Cell = defineComponent({
  props: { c: { type: Object, required: true } },
  setup: (p) => () => h('div', [
    h('div', {
      class: ['font-mono tabular-nums', p.c.warn ? 'text-garden-warn' : 'text-garden-text'],
      title: p.c.flag ? 'Below the VPD gate: irrigation does not start on a normal run' : undefined,
    }, [p.c.main, p.c.flag ? h('span', { class: 'ml-1 text-[0.625rem]' }, '▼') : null]),
    p.c.range ? h('div', { class: 'font-mono text-[0.6875rem] text-garden-dim tabular-nums' }, p.c.range) : null,
  ]),
})

// ── Sorting, paging, expanding ───────────────────────────────────────────────
const sortKey = ref('date')
const sortDir = ref('desc')
const page = ref(1)
const perPage = ref(10)
const open = ref(new Set())

function sortBy(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = key === 'date' ? 'desc' : 'asc' }
  page.value = 1
}
const arrow = (key) => sortKey.value !== key ? '' : sortDir.value === 'asc' ? ' ▲' : ' ▼'

function valueOf(r, key) {
  if (key === 'date') return r.date
  const [metric, zone] = key.split('.')
  const d = r[zone].daily
  if (!d) return null
  return metric === 'samples' ? d.sampleCount : d[metric]
}
const sortedRows = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...props.rows].sort((a, b) => {
    const x = valueOf(a, sortKey.value), y = valueOf(b, sortKey.value)
    if (x === null && y === null) return 0
    if (x === null) return 1            // missing values always last
    if (y === null) return -1
    return (x < y ? -1 : x > y ? 1 : 0) * dir
  })
})
const pages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / perPage.value)))
const pageRows = computed(() => sortedRows.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch(() => props.rows, () => { page.value = 1 })
watch(pages, (n) => { if (page.value > n) page.value = n })

const isOpen = (date) => open.value.has(date)
function toggle(date) {
  const next = new Set(open.value)
  next.has(date) ? next.delete(date) : next.add(date)
  open.value = next
}
const prettyDate = (s) => new Date(`${s}T00:00:00Z`).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

// Phone cards: the daily values, plus the three periods when the card is open.
function cardParts(r) {
  const parts = [{ label: 'Daily', data: { lowland: r.lowland.daily, highland: r.highland.daily } }]
  if (isOpen(r.date)) {
    for (const p of PERIODS) parts.push({ label: p.label, data: { lowland: r.lowland[p.id], highland: r.highland[p.id] } })
  }
  return parts
}
</script>