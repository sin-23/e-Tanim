<template>
  <div class="p-4 lg:p-6 space-y-5 pb-12">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- Each reservoir: title outside the card, like the other pages -->
      <div v-for="r in reservoirs" :key="r.id">
        <h2 class="text-sm font-bold text-garden-text mb-3 flex items-center gap-2">
          <span class="text-base leading-none">{{ r.emoji }}</span>
          {{ r.label }}
          <span class="text-[10px] font-medium text-garden-dim">· {{ r.subtitle }}</span>
        </h2>
        <ReservoirCard :reservoir="r" @save-threshold="onSaveThreshold" />
      </div>
    </div>
  </div>
</template>

<script setup>
import ReservoirCard from '@/components/ReservoirCard.vue'
import { useReservoirs } from '@/composables/useReservoirs'

const { reservoirs, saveLowThreshold } = useReservoirs()

// The card validates input and shows its own error, so it passes a callback
// that resolves on success and throws on failure.
function onSaveThreshold({ id, pct, done, fail }) {
  saveLowThreshold(id, pct).then(done).catch(fail)
}
</script>