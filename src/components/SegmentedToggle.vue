<template>
  <div class="inline-flex rounded-xl bg-garden-base p-1" role="group" :aria-label="ariaLabel">
    <button
      v-for="o in options"
      :key="o.id"
      type="button"
      :aria-pressed="modelValue === o.id"
      class="px-4 py-2 rounded-lg text-xs font-bold transition-colors"
      :class="modelValue === o.id
        ? 'bg-garden-surface text-garden-primary shadow-sm'
        : 'text-garden-dim hover:text-garden-text'"
      @click="$emit('update:modelValue', o.id)"
    >{{ o.label }}</button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true },
  options:    { type: Array, required: true },   // [{ id, label }]
  ariaLabel:  { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>