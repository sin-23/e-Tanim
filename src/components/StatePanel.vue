<template>
  <div class="rounded-2xl border border-garden-border bg-garden-surface p-10 text-center">
    <div v-if="state === 'loading'" class="space-y-3 animate-pulse" aria-busy="true">
      <div class="h-3 w-1/3 mx-auto rounded bg-garden-base" />
      <div class="h-3 w-1/2 mx-auto rounded bg-garden-base" />
      <div class="sr-only">Loading {{ noun }}…</div>
    </div>
    <template v-else>
      <div class="text-sm font-bold" :class="state === 'error' ? 'text-garden-danger' : 'text-garden-text'">
        {{ state === 'error' ? `Could not load ${noun}` : `No ${noun} for this range` }}
      </div>
      <div class="text-xs text-garden-dim mt-1">
        {{ state === 'error' ? 'Check the connection and try again.' : 'Adjust the filters to view another period.' }}
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  state: { type: String, required: true },   // 'loading' | 'empty' | 'error'
  noun:  { type: String, default: 'items' },
})
</script>