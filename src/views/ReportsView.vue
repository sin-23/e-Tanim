<template>
  <div class="p-4 lg:p-6 space-y-5 pb-12">
    <SegmentedToggle v-model="tab" :options="tabs" aria-label="Reports sections" />

    <section v-show="tab === 'sensors'">
      <ReportsSensorAverages />
    </section>

    <!-- Mounted the first time the tab opens, and only with a unit: the fruit listeners need a systemId -->
    <section v-show="tab === 'detections'">
      <ReportsDetections v-if="visitedDetections && systemId" />
      <div v-else-if="visitedDetections" class="rounded-2xl border border-garden-border bg-garden-surface p-10 text-center text-sm font-bold text-garden-text">
        Not joined to a unit yet.
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import SegmentedToggle from '@/components/SegmentedToggle.vue'
import ReportsSensorAverages from '@/components/ReportsSensorAverages.vue'
import ReportsDetections from '@/components/ReportsDetections.vue'
import { systemId } from '@/composables/useSystemId'

const tabs = [
  { id: 'sensors',    label: 'Sensor Averages' },
  { id: 'detections', label: 'Detections' },
]
const tab = ref('sensors')
const visitedDetections = ref(false)
watch(tab, (t) => { if (t === 'detections') visitedDetections.value = true })
</script>