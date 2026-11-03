<template>
  <span
    class="px-2 py-0.5 rounded-full border"
    :class="[toneOf(tone).pill, size === 'sm' ? 'text-[0.5625rem] font-bold' : 'text-[0.625rem] font-semibold']"
  ><slot /></span>
</template>

<script setup>
import { toneOf } from '@/utils/statusTone'

defineProps({
  tone: { type: String, default: 'neutral' },   // good | warn | danger | info | neutral
  size: { type: String, default: 'md' },        // md | sm
})
</script>