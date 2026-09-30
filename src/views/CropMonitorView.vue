<template>
  <div class="p-4 lg:p-6 space-y-5 pb-12">
    <DetectionCard v-for="crop in detections" :key="crop.id" :detection="crop" />
  </div>
</template>

<script setup>
import DetectionCard from '@/components/DetectionCard.vue'
import { useDetections } from '@/composables/useDetections'

const { detections } = useDetections()
</script>