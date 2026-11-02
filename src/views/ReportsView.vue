<template>
  <div class="p-4 lg:p-6 space-y-5 pb-12">
    <SegmentedToggle v-model="tab" :options="tabs" aria-label="Reports sections" />

    <!-- Sensor Averages: filled in the reports phase for averages -->
    <section
      v-show="tab === 'sensors'"
      class="space-y-5"
    />

    <!-- Detections: filled in the reports phase for detections -->
    <section
      v-show="tab === 'detections'"
      class="space-y-5"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SegmentedToggle from '@/components/SegmentedToggle.vue'

const tabs = [
  { id: 'sensors',    label: 'Sensor Averages' },
  { id: 'detections', label: 'Detections' },
]
const tab = ref('sensors')
</script>