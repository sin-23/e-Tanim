<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        class="relative z-10 w-full max-h-[92vh] overflow-y-auto rounded-2xl border bg-garden-surface shadow-2xl"
        :class="[widthClass, borderClass]"
        @click.stop
      >
        <div class="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-garden-border bg-garden-surface">
          <div class="min-w-0">
            <div v-if="eyebrow" class="text-[0.625rem] uppercase tracking-widest text-garden-dim font-bold">{{ eyebrow }}</div>
            <h2 class="text-base font-semibold text-garden-text truncate">{{ title }}</h2>
          </div>
          <button
            type="button"
            class="w-8 h-8 rounded-full bg-garden-base flex items-center justify-center text-garden-dim hover:bg-garden-border transition-colors flex-shrink-0"
            aria-label="Close"
            @click="$emit('close')"
          >✕</button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { watch, onUnmounted } from 'vue'

const props = defineProps({
  open:       { type: Boolean, default: false },
  title:      { type: String, required: true },
  eyebrow:    { type: String, default: '' },
  widthClass: { type: String, default: 'max-w-md' },
  borderClass: { type: String, default: 'border-garden-border' },
})
const emit = defineEmits(['close'])

function onKey(e) { if (e.key === 'Escape') emit('close') }
watch(() => props.open, (o) => {
  if (o) document.addEventListener('keydown', onKey)
  else document.removeEventListener('keydown', onKey)
}, { immediate: true })
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>