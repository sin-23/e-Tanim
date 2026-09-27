<template>
  <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm p-4">
    <div class="flex items-center gap-3">
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        :style="{ backgroundColor: `${color}1f`, color }"
      >
        <slot />
      </div>

      <div class="flex-1 min-w-0">
        <div class="text-xs font-bold text-garden-text truncate">{{ title }}</div>
        <div class="text-[9px] text-garden-dim mt-0.5 truncate">{{ subtitle }}</div>
      </div>

      <div class="text-right flex-shrink-0">
        <div class="flex items-center gap-1.5 justify-end">
          <div
            class="w-1.5 h-1.5 rounded-full"
            :class="active ? 'animate-pulse' : ''"
            :style="{ backgroundColor: active ? color : '#94a3b8' }"
          />
          <span
            class="text-[10px] font-bold"
            :style="{ color: active ? color : 'rgb(var(--garden-dim))' }"
          >{{ status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  color: { type: String, default: '#2d7a4f' },
  status: { type: String, required: true },
  active: { type: Boolean, default: false },
})
</script>