<template>
  <div class="p-4 lg:p-6 space-y-5 pb-12">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ReservoirCard v-for="r in reservoirs" :key="r.id" :reservoir="r" />
    </div>
  </div>
</template>

<script setup>
import ReservoirCard from '@/components/ReservoirCard.vue'
import { useReservoirs } from '@/composables/useReservoirs'

const { reservoirs } = useReservoirs()
</script>