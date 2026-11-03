<template>
  <BaseModal
    :open="open"
    :title="fruit ? `Fruit ${fruit.id}` : 'Fruit'"
    :eyebrow="fruit ? fruit.crop : ''"
    width-class="max-w-lg"
    @close="!viewing && $emit('close')"
  >
    <div v-if="fruit" class="p-5 space-y-5">
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge :tone="STAGE_TONE[fruit.stage]" class="capitalize">{{ fruit.stage }}</StatusBadge>
        <StatusBadge :tone="STATUS_TONE[fruit.status]">{{ fruit.status }}</StatusBadge>
      </div>

      <!-- Marked harvested, then seen again an hour later (harvest check) -->
      <div v-if="check" class="rounded-xl border p-3 bg-garden-warn/10 border-garden-warn/50">
        <div class="text-xs font-bold text-garden-warn">Seen again after being marked harvested</div>
        <p class="text-[0.6875rem] text-garden-dim mt-1">The Mini PC is still tracking this fruit. Is it still on the plant?</p>
        <div class="flex gap-2 mt-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-garden-border text-[0.6875rem] font-bold text-garden-text disabled:opacity-50"
            :disabled="checkBusy"
            @click="$emit('resolve-check', 'not_harvested')"
          >Still on the plant</button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-garden-border text-[0.6875rem] font-bold text-garden-dim disabled:opacity-50"
            :disabled="checkBusy"
            @click="$emit('resolve-check', 'dismissed')"
          >Keep as harvested</button>
        </div>
      </div>

      <dl class="grid grid-cols-2 gap-3 text-xs">
        <div><dt class="text-[0.625rem] text-garden-dim">Confidence</dt><dd class="font-mono text-garden-text mt-0.5">{{ Math.round(fruit.confidence * 100) }}%</dd></div>
        <div><dt class="text-[0.625rem] text-garden-dim">First seen</dt><dd class="text-garden-text mt-0.5">{{ formatDateTime(fruit.firstSeen) }}</dd></div>
        <div><dt class="text-[0.625rem] text-garden-dim">Last seen</dt><dd class="text-garden-text mt-0.5">{{ formatDateTime(fruit.updatedAt) }}</dd></div>
        <div v-if="fruit.harvestedAt"><dt class="text-[0.625rem] text-garden-dim">Marked harvested</dt><dd class="text-garden-text mt-0.5">{{ formatDateTime(fruit.harvestedAt) }}</dd></div>
      </dl>

      <section>
        <h3 class="text-xs font-extrabold text-garden-text mb-2">Entries</h3>
        <p v-if="!fruit.entries.length" class="text-xs text-garden-dim">No entries recorded for this fruit.</p>
        <ol v-else class="space-y-2">
          <li
            v-for="(e, i) in fruit.entries"
            :key="e.id"
            class="flex items-center justify-between gap-3 rounded-xl border border-garden-border px-3 py-2"
          >
            <div class="min-w-0">
              <div class="text-xs font-bold text-garden-text">{{ entryLabel(fruit.entries, i) }}</div>
              <div class="text-[0.625rem] text-garden-dim capitalize">
                {{ e.stage }} · {{ Math.round(e.confidence * 100) }}% · {{ formatDateTime(e.timestamp) }}
              </div>
            </div>
            <button
              type="button"
              class="text-xs font-bold text-garden-primary flex-shrink-0"
              @click="$emit('snapshot', e)"
            >Snapshot</button>
          </li>
        </ol>
      </section>

      <button
        v-if="fruit.status !== FRUIT_STATUS.presumed"
        type="button"
        class="w-full py-2.5 rounded-xl border border-garden-border text-xs font-bold text-garden-primary disabled:opacity-50"
        :disabled="busy"
        @click="$emit('toggle-harvest')"
      >{{ fruit.status === FRUIT_STATUS.harvested ? 'Undo harvested' : 'Mark as harvested' }}</button>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from '@/components/BaseModal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { FRUIT_STATUS, STAGE_TONE, STATUS_TONE } from '@/composables/useDetections'
import { entryLabel } from '@/composables/useSnapshots'
import { formatDateTime } from '@/utils/formatTime'

defineProps({
  open:    { type: Boolean, default: false },
  fruit:   { type: Object, default: null },    // a row of fruitRows, with entries
  busy:    { type: Boolean, default: false },
  viewing: { type: Boolean, default: false },  // a snapshot is open on top: Escape closes that first
  check:     { type: Object, default: null },  // the open harvest_check notification for this fruit
  checkBusy: { type: Boolean, default: false },
})
defineEmits(['close', 'snapshot', 'toggle-harvest', 'resolve-check'])
</script>