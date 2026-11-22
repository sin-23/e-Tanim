<template>
  <div class="p-4 lg:p-6 space-y-5 pb-12">
    <div class="flex flex-wrap items-center gap-3">
      <SegmentedToggle v-model="tab" :options="tabs" aria-label="Reports sections" />

      <!-- One Export control for the whole page: choose what, then the format. -->
      <div ref="menuRoot" class="ml-auto relative">
        <button
          ref="menuButton" type="button"
          class="whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-garden-primary text-white text-xs font-bold disabled:opacity-60"
          aria-haspopup="true" :aria-expanded="menuOpen" aria-controls="export-menu"
          :disabled="exporting" @click="menuOpen = !menuOpen"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5M4 15v1.5A1.5 1.5 0 0 0 5.5 18h9a1.5 1.5 0 0 0 1.5-1.5V15"/></svg>
          {{ exporting ? 'Preparing…' : 'Export' }}
          <svg v-if="!exporting" class="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 8 5 5 5-5"/></svg>
        </button>

        <div
          v-if="menuOpen" id="export-menu" role="group" aria-label="Export options"
          class="absolute right-0 top-full mt-2 z-30 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-garden-border bg-garden-surface shadow-card p-4 space-y-4"
        >
          <fieldset>
            <legend class="text-[0.625rem] font-bold uppercase tracking-wider text-garden-dim mb-2">What to export</legend>
            <label class="flex items-start gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-garden-base" :class="scope === 'tab' ? 'bg-garden-base' : ''">
              <input v-model="scope" type="radio" name="export-scope" value="tab" class="mt-0.5 accent-garden-primary" />
              <span>
                <span class="block text-xs font-bold text-garden-text">This tab: {{ tab === 'sensors' ? 'Sensor Averages' : 'Detections' }}</span>
                <span class="block text-[0.6875rem] text-garden-dim">The date range you chose</span>
              </span>
            </label>
            <label class="flex items-start gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-garden-base" :class="scope === 'all' ? 'bg-garden-base' : ''">
              <input v-model="scope" type="radio" name="export-scope" value="all" class="mt-0.5 accent-garden-primary" />
              <span>
                <span class="block text-xs font-bold text-garden-text">Everything</span>
                <span class="block text-[0.6875rem] text-garden-dim">Both tabs, all dates (ignores the date ranges)</span>
              </span>
            </label>
          </fieldset>

          <div>
            <div class="text-[0.625rem] font-bold uppercase tracking-wider text-garden-dim mb-2">Download as</div>
            <div class="space-y-1.5">
              <button
                v-for="f in FORMATS" :key="f.id" type="button"
                class="w-full text-left px-3 py-2 rounded-xl border border-garden-border hover:border-garden-primary hover:bg-garden-base transition-colors"
                @click="runExport(f.id)"
              >
                <span class="block text-xs font-bold text-garden-text">{{ f.label }}</span>
                <span class="block text-[0.6875rem] text-garden-dim">{{ f.hint }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p v-if="exportMsg" role="status" class="text-[0.6875rem] font-semibold" :class="exportOk ? 'text-garden-dim' : 'text-garden-warn'">{{ exportMsg }}</p>

    <section v-show="tab === 'sensors'">
      <ReportsSensorAverages ref="sensorsRef" />
    </section>

    <!-- Mounted the first time the tab opens, and only with a unit: the fruit listeners need a systemId -->
    <section v-show="tab === 'detections'">
      <ReportsDetections v-if="visitedDetections && systemId" ref="detectionsRef" />
      <div v-else-if="visitedDetections" class="rounded-2xl border border-garden-border bg-garden-surface p-10 text-center text-sm font-bold text-garden-text">
        Not joined to a unit yet.
      </div>
    </section>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SegmentedToggle from '@/components/SegmentedToggle.vue'
import ReportsSensorAverages from '@/components/ReportsSensorAverages.vue'
import ReportsDetections from '@/components/ReportsDetections.vue'
import { systemId } from '@/composables/useSystemId'
import { downloadFiles } from '@/utils/reportCsv'

const tabs = [
  { id: 'sensors',    label: 'Sensor Averages' },
  { id: 'detections', label: 'Detections' },
]
const tab = ref('sensors')
const visitedDetections = ref(false)
watch(tab, (t) => { if (t === 'detections') visitedDetections.value = true })

// ── Export ──────────────────────────────────────────────────────────────────
// One menu for the page. Scope "This tab" exports the active tab for the date range it shows;
// scope "Everything" ignores the ranges and exports the full history of both tabs. Each tab
// builds its own files (buildExport). CSV and Excel give one file per tab, PDF one report per tab.
// The Detections tab is mounted on demand so its records can load.
const FORMATS = [
  { id: 'csv',  label: 'CSV',   hint: 'One file per tab, for spreadsheets and code' },
  { id: 'xlsx', label: 'Excel', hint: 'One workbook per tab, a sheet for each table' },
  { id: 'pdf',  label: 'PDF',   hint: 'A plain-language report with charts' },
]
const sensorsRef = ref(null)
const detectionsRef = ref(null)
const menuRoot = ref(null)
const menuButton = ref(null)
const menuOpen = ref(false)
const scope = ref('tab')
const exporting = ref(false)
const exportMsg = ref('')
const exportOk = ref(false)
let msgTimer = null

function say(text, ok) {
  exportMsg.value = text; exportOk.value = ok
  clearTimeout(msgTimer)
  if (ok) msgTimer = setTimeout(() => { exportMsg.value = '' }, 6000)
}
const onPointer = (e) => { if (menuOpen.value && menuRoot.value && !menuRoot.value.contains(e.target)) menuOpen.value = false }
const onKey = (e) => { if (e.key === 'Escape' && menuOpen.value) { menuOpen.value = false; menuButton.value?.focus() } }
onMounted(() => { document.addEventListener('mousedown', onPointer); document.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey); clearTimeout(msgTimer) })

async function collect(format) {
  if (scope.value === 'tab') {
    const target = tab.value === 'sensors' ? sensorsRef.value : detectionsRef.value
    const files = await target?.buildExport(false, format)
    return { files: files || [], miss: files ? [] : [tab.value === 'sensors' ? 'Sensor Averages' : 'Detections'] }
  }
  visitedDetections.value = true
  await nextTick()
  const files = [], miss = []
  const a = await sensorsRef.value?.buildExport(true, format); a ? files.push(...a) : miss.push('Sensor Averages')
  // Wait up to 10 seconds for the fruit records to load (they start loading when the tab mounts).
  let d = null
  for (let i = 0; i < 40 && !d && systemId.value; i++) {
    d = await detectionsRef.value?.buildExport(true, format) ?? null
    if (!d) await new Promise(r => setTimeout(r, 250))
  }
  d ? files.push(...d) : miss.push('Detections')
  return { files, miss }
}

async function runExport(format) {
  menuOpen.value = false
  exporting.value = true; say('', false)
  try {
    const { files, miss } = await collect(format)
    if (files.length) await downloadFiles(files)
    if (miss.length) say(`Nothing to export from ${miss.join(' and ')} yet. Check the date range, or wait for the data to load.`, false)
    else say(`Downloaded ${files.length} file${files.length === 1 ? '' : 's'}.`, true)
  } catch (e) {
    say('The export failed. Try again, or use a different format.', false)
  } finally { exporting.value = false }
}
</script>