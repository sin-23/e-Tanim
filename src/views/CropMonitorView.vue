<template>
  <div class="p-4 lg:p-6 space-y-5 pb-12">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-extrabold text-garden-text">Crop Monitor</h1>
        <p class="text-sm text-garden-dim mt-0.5">Tracked fruit and harvest review from the Mini PC.</p>
      </div>
      <div
        v-if="miniPc.loaded"
        class="inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5"
        :class="miniPc.online
          ? 'bg-garden-good/10 border-garden-good/30 text-garden-good'
          : 'bg-garden-danger/10 border-garden-danger/30 text-garden-danger'"
      >
        <span class="w-2 h-2 rounded-full" :class="miniPc.online ? 'bg-garden-live animate-pulse' : 'bg-garden-danger'" />
        <span class="text-[0.6875rem] font-bold">{{ miniPc.online ? 'Mini PC online' : 'Mini PC offline' }}</span>
        <span v-if="miniPc.lastCycleAt" class="text-[0.625rem] text-garden-dim">Last cycle {{ formatDateTime(miniPc.lastCycleAt) }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <DetectionCard v-for="crop in detections" :key="crop.id" :detection="crop" :show-fruit-log="false" />
    </div>

    <section class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4">
      <div class="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_1.5fr_1.2fr] gap-3">
        <label v-for="filter in filterOptions" :key="filter.key" class="text-[0.625rem] font-bold text-garden-dim">{{ filter.label }}
          <select v-model="filters[filter.key]" :class="inputCls">
            <option v-for="option in filter.options" :key="option">{{ option }}</option>
          </select>
        </label>
        <label class="col-span-2 lg:col-span-1 text-[0.625rem] font-bold text-garden-dim">Fruit ID
          <input v-model="filters.search" :class="inputCls" placeholder="Search ID" />
        </label>
        <div class="col-span-2 lg:col-span-1">
          <div class="text-[0.625rem] font-bold text-garden-dim">Sort</div>
          <div class="flex gap-2">
            <select v-model="filters.sort" :class="inputCls">
              <option v-for="s in SORTS" :key="s">{{ s }}</option>
            </select>
            <button
              type="button"
              class="mt-1.5 w-10 flex-shrink-0 rounded-xl border border-garden-border bg-garden-surface text-garden-dim hover:text-garden-primary"
              :aria-label="sortDir === 'asc' ? 'Sort descending' : 'Sort ascending'"
              @click="sortDir = sortDir === 'asc' ? 'desc' : 'asc'"
            >{{ sortDir === 'asc' ? '↑' : '↓' }}</button>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b border-garden-border">
        <h2 class="text-sm font-extrabold text-garden-text">Fruit list</h2>
        <p class="text-[0.625rem] text-garden-dim">{{ filteredFruits.length }} tracked fruit</p>
      </div>

      <div v-if="loading" class="p-10 text-center text-xs text-garden-dim">Loading tracked fruit…</div>
      <div v-else-if="error" class="p-10 text-center">
        <div class="text-sm font-bold text-garden-danger">Could not load fruit</div>
        <p class="text-xs text-garden-dim mt-1">Check the connection and try again.</p>
      </div>
      <div v-else-if="filteredFruits.length === 0" class="p-10 text-center">
        <div class="text-sm font-bold text-garden-text">No fruit found</div>
        <p class="text-xs text-garden-dim mt-1">{{ fruitRows.length ? 'Try changing the filters or search.' : 'The Mini PC has not reported any fruit yet.' }}</p>
      </div>

      <template v-else>
        <div class="hidden md:block overflow-x-auto">
          <!-- table-fixed with set column widths: the table no longer re-flows when a
               status, badge or button label changes length -->
          <table class="w-full min-w-[70rem] table-fixed text-left">
            <colgroup>
              <col class="w-[6rem]" /><col class="w-[6rem]" /><col class="w-[6rem]" />
              <col class="w-[5.5rem]" /><col class="w-[9.5rem]" /><col class="w-[9.5rem]" />
              <col class="w-[13rem]" /><col class="w-[5rem]" /><col class="w-[8.5rem]" />
            </colgroup>
            <thead class="bg-garden-base text-[0.625rem] uppercase tracking-wider text-garden-dim">
              <tr><th v-for="h in headers" :key="h" class="px-3 py-3 font-bold">{{ h }}</th></tr>
            </thead>
            <tbody class="divide-y divide-garden-border">
              <tr v-for="fruit in filteredFruits" :key="`${fruit.cropId}/${fruit.id}`" class="text-xs h-[3.25rem]">
                <td class="px-3 py-3 font-mono font-bold">
                  <button type="button" class="text-garden-text hover:text-garden-primary" @click="openFruit(fruit)">{{ fruit.id }}</button>
                </td>
                <td class="px-3 py-3">{{ fruit.crop }}</td>
                <td class="px-3 py-3"><StatusBadge size="sm" :tone="STAGE_TONE[fruit.stage]" class="capitalize">{{ fruit.stage }}</StatusBadge></td>
                <td class="px-3 py-3 font-mono">{{ Math.round(fruit.confidence * 100) }}%</td>
                <td class="px-3 py-3 text-garden-dim">{{ formatDateTime(fruit.firstSeen) }}</td>
                <td class="px-3 py-3 text-garden-dim">{{ formatDateTime(fruit.updatedAt) }}</td>
                <td class="px-3 py-3 whitespace-nowrap">
                  <StatusBadge size="sm" :tone="STATUS_TONE[fruit.status]">{{ fruit.status }}</StatusBadge>
                  <StatusBadge v-if="checkOf(fruit)" size="sm" tone="warn" class="ml-1">Seen again</StatusBadge>
                </td>
                <td class="px-3 py-3">
                  <button
                    v-if="latestEntry(fruit)"
                    type="button"
                    class="text-garden-primary font-bold"
                    @click="openSnapshot(fruit, latestEntry(fruit))"
                  >Snapshot</button>
                  <span v-else class="text-garden-dim">None</span>
                </td>
                <td class="px-3 py-3">
                  <button
                    v-if="fruit.status !== FRUIT_STATUS.presumed"
                    type="button"
                    class="text-garden-primary font-bold whitespace-nowrap disabled:opacity-50"
                    :disabled="busyKey === `${fruit.cropId}/${fruit.id}`"
                    @click="toggleHarvest(fruit)"
                  >{{ fruit.status === FRUIT_STATUS.harvested ? 'Undo' : 'Mark as harvested' }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="md:hidden divide-y divide-garden-border">
          <article v-for="fruit in filteredFruits" :key="`${fruit.cropId}/${fruit.id}`" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <button type="button" class="font-mono text-sm font-bold text-garden-text" @click="openFruit(fruit)">{{ fruit.id }}</button>
                <div class="text-xs text-garden-dim mt-0.5">{{ fruit.crop }} · {{ Math.round(fruit.confidence * 100) }}%</div>
              </div>
              <StatusBadge size="sm" :tone="STAGE_TONE[fruit.stage]" class="capitalize">{{ fruit.stage }}</StatusBadge>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-3 text-[0.625rem]">
              <div><span class="text-garden-dim">First seen</span><div class="text-garden-text mt-0.5">{{ formatDateTime(fruit.firstSeen) }}</div></div>
              <div><span class="text-garden-dim">Last seen</span><div class="text-garden-text mt-0.5">{{ formatDateTime(fruit.updatedAt) }}</div></div>
            </div>
            <div class="mt-3 flex items-center justify-between">
              <div>
                <StatusBadge size="sm" :tone="STATUS_TONE[fruit.status]">{{ fruit.status }}</StatusBadge>
                <StatusBadge v-if="checkOf(fruit)" size="sm" tone="warn" class="ml-1">Seen again</StatusBadge>
              </div>
              <button
                v-if="latestEntry(fruit)"
                type="button"
                class="text-[0.625rem] font-bold text-garden-primary"
                @click="openSnapshot(fruit, latestEntry(fruit))"
              >Snapshot</button>
            </div>
            <button
              v-if="fruit.status !== FRUIT_STATUS.presumed"
              type="button"
              class="mt-3 w-full py-2 rounded-lg border border-garden-border text-[0.625rem] font-bold text-garden-primary disabled:opacity-50"
              :disabled="busyKey === `${fruit.cropId}/${fruit.id}`"
              @click="toggleHarvest(fruit)"
            >{{ fruit.status === FRUIT_STATUS.harvested ? 'Undo' : 'Mark as harvested' }}</button>
          </article>
        </div>
      </template>
    </section>

    <FruitDetail
      :open="!!selected"
      :fruit="selected"
      :busy="busyKey === selectedKey"
      :viewing="!!snap"
      :check="selected ? checkOf(selected) : null"
      :check-busy="!!selected && !!checkOf(selected) && busyId === checkOf(selected).id"
      @resolve-check="(kind) => resolveCheck(checkOf(selected), kind)"
      @close="selectedKey = null"
      @snapshot="(e) => openSnapshot(selected, e)"
      @toggle-harvest="toggleHarvest(selected)"
    />
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
import { computed, reactive, ref } from 'vue'
import DetectionCard from '@/components/DetectionCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import FruitDetail from '@/components/FruitDetail.vue'
import SnapshotViewer from '@/components/SnapshotViewer.vue'
import { useDetections, FRUIT_STATUS, STAGE_TONE, STATUS_TONE } from '@/composables/useDetections'
import { useFrameRequests } from '@/composables/useSnapshots'
import { useNotifications } from '@/composables/useNotifications'
import { formatDateTime } from '@/utils/formatTime'

const { detections, fruitRows, miniPc, setHarvested } = useDetections()
const { requestsByPath } = useFrameRequests()
const { openCheckFor, resolveCheck, busyId } = useNotifications()
const checkOf = (fruit) => openCheckFor(fruit.cropId, fruit.id)

const SORTS = ['Last seen', 'First seen', 'Stage', 'Confidence', 'Fruit ID']
const STAGE_RANK = { underripe: 1, ripe: 2, damaged: 3 }

const filters = reactive({ crop: 'All crops', stage: 'All stages', status: 'All statuses', search: '', sort: 'Last seen' })
const sortDir = ref('desc')
const busyKey = ref(null)

const filterOptions = computed(() => [
  { key: 'crop',   label: 'Crop',   options: ['All crops', ...detections.value.map(d => d.label)] },
  { key: 'stage',  label: 'Stage',  options: ['All stages', 'Underripe', 'Ripe', 'Damaged'] },
  { key: 'status', label: 'Status', options: ['All statuses', ...Object.values(FRUIT_STATUS)] },
])
const inputCls = 'mt-1.5 w-full rounded-xl border border-garden-border bg-garden-surface px-3 py-2 text-xs font-semibold text-garden-text focus:outline-none focus:border-garden-primary'
const headers = ['Fruit ID', 'Crop', 'Stage', 'Confidence', 'First seen', 'Last seen', 'Status', 'Snapshot', 'Actions']

const loading = computed(() => detections.value.every(d => d.loading))
const error = computed(() => detections.value.some(d => d.error))

const sortValue = {
  'Last seen':  f => f.updatedAt,
  'First seen': f => f.firstSeen,
  'Stage':      f => STAGE_RANK[f.stage],
  'Confidence': f => f.confidence,
  'Fruit ID':   f => f.id,
}

const filteredFruits = computed(() => {
  const q = filters.search.trim().toLowerCase()
  const dir = sortDir.value === 'asc' ? 1 : -1
  const get = sortValue[filters.sort]
  return fruitRows.value
    .filter(f =>
      (filters.crop === 'All crops' || f.crop === filters.crop) &&
      (filters.stage === 'All stages' || f.stage === filters.stage.toLowerCase()) &&
      (filters.status === 'All statuses' || f.status === filters.status) &&
      (!q || f.id.toLowerCase().includes(q)))
    .sort((a, b) => {
      const x = get(a), y = get(b)
      return (x > y ? 1 : x < y ? -1 : 0) * dir
    })
})

// Detail and snapshot views. The selected fruit is looked up in the live rows,
// so marking it harvested updates the open detail.
const selectedKey = ref(null)
const selected = computed(() =>
  fruitRows.value.find(f => `${f.cropId}/${f.id}` === selectedKey.value) || null)
const snap = ref(null)   // { fruit, entry }

const latestEntry = (fruit) => fruit.entries[fruit.entries.length - 1] || null
const openFruit = (fruit) => { selectedKey.value = `${fruit.cropId}/${fruit.id}` }
const openSnapshot = (fruit, entry) => { snap.value = { fruit, entry } }

async function toggleHarvest(fruit) {
  busyKey.value = `${fruit.cropId}/${fruit.id}`
  const undoing = fruit.status === FRUIT_STATUS.harvested
  const check = undoing ? checkOf(fruit) : null
  // Undoing a fruit that has an open "seen again" check is the same as "Not harvested":
  // resolve the check too, so the alert does not stay open for a fruit that is no longer marked.
  if (check) await resolveCheck(check, 'not_harvested')
  else await setHarvested(fruit.cropId, fruit.id, !undoing)
  busyKey.value = null
}
</script>