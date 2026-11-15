<template>
  <div class="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 border-t border-garden-border text-[0.6875rem] text-garden-dim">
    <label class="font-bold">Rows per page
      <select
        class="ml-1 rounded-lg border border-garden-border bg-garden-surface px-2 py-1 font-semibold text-garden-text"
        :value="perPage"
        @change="$emit('update:perPage', +$event.target.value); $emit('update:page', 1)"
      >
        <option v-for="n in [10, 25, 50]" :key="n" :value="n">{{ n }}</option>
      </select>
    </label>
    <div class="flex items-center gap-2">
      <span>{{ total }} {{ noun }}{{ total === 1 ? '' : 's' }} · page {{ page }} of {{ pages }}</span>
      <button type="button" :disabled="page <= 1" class="px-2.5 py-1 rounded-lg border border-garden-border font-bold disabled:opacity-40" @click="$emit('update:page', page - 1)">Prev</button>
      <button type="button" :disabled="page >= pages" class="px-2.5 py-1 rounded-lg border border-garden-border font-bold disabled:opacity-40" @click="$emit('update:page', page + 1)">Next</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  page:    { type: Number, required: true },
  perPage: { type: Number, required: true },
  total:   { type: Number, required: true },
  pages:   { type: Number, required: true },
  noun:    { type: String, default: 'row' },
})
defineEmits(['update:page', 'update:perPage'])
</script>