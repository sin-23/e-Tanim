<template>
  <div class="space-y-5">
    <!-- Controls -->
    <div class="rounded-2xl border border-garden-border bg-garden-surface p-4 flex flex-wrap items-end gap-4">
      <DateRangePicker v-model="range" />
      <div>
        <div class="text-[0.625rem] font-bold text-garden-dim mb-1.5">Crop</div>
        <SegmentedToggle v-model="cropSel" :options="CROP_OPTIONS" aria-label="Crop shown" />
      </div>
    </div>

    <StatePanel v-if="panelState" :state="panelState" noun="fruit records" />

    <template v-else>
      <!-- Summary -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div v-for="c in summary" :key="c.label" class="rounded-2xl border border-garden-border bg-garden-surface p-4">
          <div class="text-[0.625rem] font-bold uppercase tracking-wide text-garden-dim">{{ c.label }}</div>
          <div class="mt-1 text-xl font-extrabold text-garden-text">{{ c.value }}</div>
          <div class="mt-0.5 text-[0.6875rem] text-garden-dim">{{ c.note }}</div>
        </div>
      </div>

      <!-- Chart: fruit on the plant per day, all crops combined or the chosen crop -->
      <div class="rounded-2xl border border-garden-border bg-garden-surface p-4">
        <div class="text-sm font-bold text-garden-text">Fruit on the plant, per day
          <span class="text-garden-dim font-semibold">· {{ cropSel === 'all' ? 'all crops combined' : cropLabel }}</span>
        </div>
        <div class="mt-2 mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] font-semibold text-garden-dim">
          <span v-for="s in STAGES" :key="s" class="flex items-center gap-1.5 capitalize">
            <span class="inline-block h-0.5 w-3.5 rounded" :class="STAGE_SWATCH[s]" />{{ s }}
          </span>
        </div>
        <LineChart v-if="plant.any" :labels="chartLabels" :datasets="plant.sets" :legend="false" counts hover-points
                   :decimals="0" height="16rem"
                   :aria-label="`Fruit on the plant per day by stage, ${cropSel === 'all' ? 'all crops combined' : cropLabel}`" />
        <div v-else class="flex h-[16rem] items-center justify-center rounded-xl border border-dashed border-garden-border text-xs text-garden-dim">
          No fruit on the plant in this range.
        </div>
        <p class="mt-2 text-[0.6875rem] text-garden-dim">
          Each line counts the fruit on the plant that day, by the stage it had that day. A fruit is on the plant from the day it
          was first seen through its harvest day. Days are in garden time (UTC+8).
        </p>
        <details class="mt-3">
          <summary class="cursor-pointer text-xs font-bold text-garden-primary">New fruit per day (counted on the day first seen, by current stage)</summary>
          <div class="mt-2 max-h-64 overflow-auto rounded-xl border border-garden-border">
            <table class="w-full text-xs">
              <thead class="sticky top-0 bg-garden-surface">
                <tr class="text-left text-garden-dim">
                  <th class="px-3 py-2 font-bold">Date</th>
                  <th v-for="s in STAGES" :key="s" class="px-3 py-2 font-bold capitalize text-right">{{ s }}</th>
                  <th class="px-3 py-2 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in [...daily].reverse()" :key="r.date" class="border-t border-garden-border">
                  <th scope="row" class="px-3 py-1.5 text-left font-semibold text-garden-text">{{ r.date }}</th>
                  <td v-for="s in STAGES" :key="s" class="px-3 py-1.5 text-right font-mono tabular-nums">{{ r[s] }}</td>
                  <td class="px-3 py-1.5 text-right font-mono font-bold tabular-nums">{{ r.total }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <!-- Per month -->
      <div class="rounded-2xl border border-garden-border bg-garden-surface p-4">
        <div class="text-sm font-bold text-garden-text mb-2">Fruit per month</div>
        <div v-if="!monthly.length" class="text-xs text-garden-dim">No fruit in this range.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-xs min-w-[32rem]">
            <thead>
              <tr class="text-left text-garden-dim">
                <th class="py-2 pr-3 font-bold">Month</th>
                <th v-for="c in monthCrops" :key="c.id" class="py-2 px-3 font-bold text-right">{{ c.label }}</th>
                <th class="py-2 px-3 font-bold text-right">First seen</th>
                <th class="py-2 pl-3 font-bold text-right">Harvested</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in monthly" :key="m.month" class="border-t border-garden-border">
                <th scope="row" class="py-2 pr-3 text-left font-semibold text-garden-text">{{ monthName(m.month) }}</th>
                <td v-for="c in monthCrops" :key="c.id" class="py-2 px-3 text-right font-mono tabular-nums">{{ m[c.id] }}</td>
                <td class="py-2 px-3 text-right font-mono font-bold tabular-nums">{{ m.total }}</td>
                <td class="py-2 pl-3 text-right font-mono tabular-nums">{{ m.harvested }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-[0.6875rem] text-garden-dim">
          First seen is counted on the day each fruit first appeared. Harvested is counted on the day the user marked it,
          or, for a fruit presumed harvested (unseen for 48 hours), on the day it was last seen.
        </p>
      </div>

      <!-- Ripe events -->
      <div class="rounded-2xl border border-garden-border bg-garden-surface p-4">
        <div class="text-sm font-bold text-garden-text mb-2">Harvest-ready events <span class="text-garden-dim font-semibold">· {{ readyEvents.length }}</span></div>
        <div v-if="!readyEvents.length" class="text-xs text-garden-dim">No ripe detections in this range.</div>
        <div v-else class="max-h-72 overflow-auto rounded-xl border border-garden-border">
          <table class="w-full text-xs">
            <thead class="sticky top-0 bg-garden-surface">
              <tr class="text-left text-garden-dim">
                <th class="px-3 py-2 font-bold">When</th><th class="px-3 py-2 font-bold">Crop</th>
                <th class="px-3 py-2 font-bold">Fruit ID</th><th class="px-3 py-2 font-bold">Event</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in readyEvents" :key="`${e.cropId}/${e.fruitId}/${e.ts}`" class="border-t border-garden-border">
                <td class="px-3 py-1.5 whitespace-nowrap">{{ formatDateTime(e.ts) }}</td>
                <td class="px-3 py-1.5">{{ e.crop }}</td>
                <td class="px-3 py-1.5 font-mono">{{ e.fruitId }}</td>
                <td class="px-3 py-1.5">{{ e.kind }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-[0.6875rem] text-garden-dim">Taken from the ripe entries of each fruit record. Times are in your time zone.</p>
      </div>

      <!-- Fruit list -->
      <div class="rounded-2xl border border-garden-border bg-garden-surface overflow-hidden">
        <div class="px-4 pt-4 text-sm font-bold text-garden-text">Fruit list <span class="text-garden-dim font-semibold">· first seen in range</span></div>
        <div v-if="!fruitList.length" class="p-4 text-xs text-garden-dim">No fruit in this range.</div>
        <template v-else>
          <div class="overflow-x-auto mt-3">
            <table class="w-full text-xs min-w-[56rem]">
              <thead>
                <tr class="text-left text-garden-dim border-b border-garden-border">
                  <th v-for="h in HEADERS" :key="h" class="px-3 py-2 font-bold whitespace-nowrap">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="f in pageFruit" :key="`${f.cropId}/${f.id}`">
                  <tr class="border-b border-garden-border">
                    <td class="px-3 py-2.5 font-mono font-bold text-garden-text">{{ f.id }}</td>
                    <td class="px-3 py-2.5">{{ f.crop }}</td>
                    <td class="px-3 py-2.5"><StatusBadge size="sm" :tone="STAGE_TONE[f.stage]" class="capitalize">{{ f.stage }}</StatusBadge></td>
                    <td class="px-3 py-2.5 font-mono tabular-nums">{{ Math.round(f.confidence * 100) }}%</td>
                    <td class="px-3 py-2.5 whitespace-nowrap">{{ formatDateTime(f.firstSeen) }}</td>
                    <td class="px-3 py-2.5 whitespace-nowrap">{{ formatDateTime(f.updatedAt) }}</td>
                    <td class="px-3 py-2.5"><StatusBadge size="sm" :tone="STATUS_TONE[f.status]">{{ f.status }}</StatusBadge></td>
                    <td class="px-3 py-2.5">
                      <button v-if="withImage(f)" type="button" class="font-bold text-garden-primary hover:underline" @click="openSnapshot(f, withImage(f))">Snapshot</button>
                      <span v-else class="text-garden-dim">—</span>
                    </td>
                    <td class="px-3 py-2.5">
                      <button type="button" class="font-bold text-garden-primary hover:underline" :aria-expanded="openFruit.has(key(f))" @click="toggleFruit(f)">
                        {{ f.entries.length }} {{ f.entries.length === 1 ? 'entry' : 'entries' }} {{ openFruit.has(key(f)) ? '▾' : '▸' }}
                      </button>
                    </td>
                  </tr>
                  <tr v-if="openFruit.has(key(f))" class="bg-garden-base/60">
                    <td colspan="9" class="px-6 py-3">
                      <div v-if="!f.entries.length" class="text-garden-dim">No entries.</div>
                      <ul v-else class="space-y-1.5">
                        <li v-for="(e, i) in f.entries" :key="e.id" class="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span class="w-36 whitespace-nowrap text-garden-dim">{{ formatDateTime(e.timestamp) }}</span>
                          <span class="w-28 font-semibold text-garden-text">{{ entryLabel(f, i) }}</span>
                          <StatusBadge size="sm" :tone="STAGE_TONE[e.stage]" class="capitalize">{{ e.stage }}</StatusBadge>
                          <span class="font-mono tabular-nums text-garden-dim">{{ Math.round(e.confidence * 100) }}%</span>
                          <button v-if="e.framePath" type="button" class="font-bold text-garden-primary hover:underline" @click="openSnapshot(f, e)">Snapshot</button>
                        </li>
                      </ul>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <TablePager v-model:page="page" v-model:perPage="perPage" :total="fruitList.length" :pages="pages" noun="fruit" />
        </template>
      </div>
    </template>

    <SnapshotViewer
      v-if="snap"
      :open="true"
      :crop="snap.fruit.cropId"
      :crop-label="snap.fruit.crop"
      :fruit-id="snap.fruit.id"
      :entries="snap.fruit.entries"
      :entry="snap.entry"
      :requests-by-path="requestsByPath"
      :mini-pc="miniPc"
      @close="snap = null"
    />
  </div>
</template>

<script setup>
// Reports > Detections. Everything is counted in the browser from the fruit records
// (useDetections); there is no daily summary node. Mounted only when the tab is opened
// and the account has a unit, because the fruit listeners need a systemId.
import { computed, ref, watch } from 'vue'
import DateRangePicker from '@/components/DateRangePicker.vue'
import SegmentedToggle from '@/components/SegmentedToggle.vue'
import StatePanel from '@/components/StatePanel.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import LineChart from '@/components/LineChart.vue'
import TablePager from '@/components/TablePager.vue'
import SnapshotViewer from '@/components/SnapshotViewer.vue'
import { useDetections, DETECTION_CROPS as CROPS, PRESUMED_HARVESTED_MS, FRUIT_STATUS, STAGE_TONE, STATUS_TONE } from '@/composables/useDetections'
import { useFrameRequests } from '@/composables/useSnapshots'
import { buildEvents, dailyRows, dayList, gardenDate, inRange, monthlyRows, onPlantByStage, STAGES } from '@/utils/detectionReport'
import { formatDateTime } from '@/utils/formatTime'

const HEADERS = ['Fruit ID', 'Crop', 'Stage', 'Confidence', 'First seen', 'Last seen', 'Status', 'Snapshot', 'Entries']
const CROP_OPTIONS = [{ id: 'all', label: 'All crops' }, ...CROPS.map(c => ({ id: c.id, label: c.label }))]
const STAGE_COLORS = { underripe: 'dim', ripe: 'good', damaged: 'danger' }
const STAGE_SWATCH = { underripe: 'bg-garden-dim', ripe: 'bg-garden-good', damaged: 'bg-garden-danger' }

const { detections, fruitRows, miniPc } = useDetections()
const { requestsByPath } = useFrameRequests()

const range = ref({ preset: '30d', from: null, to: null })
const cropSel = ref('all')
const cropFilter = computed(() => (cropSel.value === 'all' ? null : cropSel.value))
const cropLabel = computed(() => CROPS.find(c => c.id === cropSel.value)?.label ?? '')

const panelState = computed(() => {
  if (detections.value.every(d => d.loading)) return 'loading'
  if (detections.value.some(d => d.error) && !fruitRows.value.length) return 'error'
  if (!fruitRows.value.length) return 'empty'
  return null
})

// ── Events ──────────────────────────────────────────────────────────────────
const events = computed(() => buildEvents(fruitRows.value, Date.now(), PRESUMED_HARVESTED_MS))
const today = gardenDate(Date.now())
const from = computed(() => range.value.from ?? events.value.seen.reduce((m, e) => (e.date < m ? e.date : m), today))
const to = computed(() => range.value.to ?? today)
const days = computed(() => dayList(from.value, to.value))

const daily = computed(() => dailyRows(events.value.seen, days.value, cropFilter.value))
const chartLabels = computed(() => daily.value.map(r =>
  new Date(`${r.date}T00:00:00Z`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'UTC' })))
// All crops combined by default; the crop selector narrows it to one crop.
const plant = computed(() => {
  const by = onPlantByStage(events.value.seen, days.value, cropFilter.value)
  return {
    any: STAGES.some(s => by[s].some(n => n > 0)),
    sets: STAGES.map(s => ({ label: s[0].toUpperCase() + s.slice(1), data: by[s], color: STAGE_COLORS[s] })),
  }
})

// The crop selector filters the month table too: all three crops by default, one when selected.
const monthCrops = computed(() => CROPS.filter(c => !cropFilter.value || c.id === cropFilter.value))
const monthly = computed(() => monthlyRows(events.value, monthCrops.value.map(c => c.id), range.value.from, range.value.to))
const monthName = (m) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' })

const readyEvents = computed(() => events.value.ready
  .filter(e => (!cropFilter.value || e.cropId === cropFilter.value) && inRange(e.date, range.value.from, range.value.to))
  .sort((a, b) => b.ts - a.ts))

// ── Summary cards ───────────────────────────────────────────────────────────
const summary = computed(() => {
  const active = fruitRows.value.filter(f => f.status === FRUIT_STATUS.active)
  const present = CROPS.filter(c => active.some(f => f.cropId === c.id)).map(c => c.label)
  const stageCount = (s) => active.filter(f => f.stage === s).length
  const seen = events.value.seen.filter(e => (!cropFilter.value || e.cropId === cropFilter.value) && inRange(e.date, range.value.from, range.value.to))
  const harv = events.value.harvested.filter(e => (!cropFilter.value || e.cropId === cropFilter.value) && inRange(e.date, range.value.from, range.value.to))
  const byUser = harv.filter(e => e.by === 'user').length
  return [
    { label: 'Crops present now', value: present.length ? present.join(', ') : 'None', note: 'with active fruit' },
    { label: 'Active fruit now', value: String(active.length),
      note: `${stageCount('underripe')} underripe · ${stageCount('ripe')} ripe · ${stageCount('damaged')} damaged` },
    { label: 'First seen', value: String(seen.length), note: 'in this range' },
    { label: 'Harvested', value: String(harv.length), note: `${byUser} marked · ${harv.length - byUser} presumed` },
    { label: 'Ripe events', value: String(readyEvents.value.length), note: 'in this range' },
  ]
})

// ── Fruit list ──────────────────────────────────────────────────────────────
const fruitList = computed(() => fruitRows.value
  .filter(f => (!cropFilter.value || f.cropId === cropFilter.value) && inRange(gardenDate(f.firstSeen), range.value.from, range.value.to))
  .sort((a, b) => b.firstSeen - a.firstSeen))
const page = ref(1)
const perPage = ref(10)
const pages = computed(() => Math.max(1, Math.ceil(fruitList.value.length / perPage.value)))
const pageFruit = computed(() => fruitList.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([range, cropSel], () => { page.value = 1 }, { deep: true })
watch(pages, (n) => { if (page.value > n) page.value = n })

const key = (f) => `${f.cropId}/${f.id}`
const openFruit = ref(new Set())
function toggleFruit(f) {
  const next = new Set(openFruit.value)
  next.has(key(f)) ? next.delete(key(f)) : next.add(key(f))
  openFruit.value = next
}
// Same wording rule as the fruit detail: the first entry is a first sighting, a changed stage is a
// stage change, anything else is a ripe reminder (entries have no type field).
function entryLabel(f, i) {
  if (i === 0) return 'First sighting'
  return f.entries[i].stage !== f.entries[i - 1].stage ? 'Stage change' : 'Ripe reminder'
}

// The newest entry that has an image path; the Snapshot viewer shows what the cloud has.
const withImage = (f) => [...f.entries].reverse().find(e => e.framePath) || null
const snap = ref(null)   // { fruit, entry }
const openSnapshot = (fruit, entry) => { snap.value = { fruit, entry } }
</script>