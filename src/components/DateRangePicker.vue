<template>
  <div class="relative">
    <label class="text-[0.625rem] font-bold text-garden-dim">Range
      <select :value="modelValue.preset" :class="inputCls" @change="selectPreset($event.target.value)">
        <option v-for="p in PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
      </select>
    </label>

    <button
      v-if="modelValue.preset === 'custom' && chipText"
      type="button"
      class="mt-2 inline-flex items-center px-2.5 py-1 rounded-full bg-garden-primary/10 border border-garden-primary/30 text-[0.625rem] font-bold text-garden-primary"
      @click="open = true"
    >{{ chipText }}</button>

    <div
      v-if="open"
      class="absolute left-0 top-full mt-2 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-garden-border bg-garden-surface shadow-card p-4"
    >
      <div class="grid grid-cols-2 gap-3">
        <label class="text-[0.625rem] font-bold text-garden-dim">From
          <input v-model="from" type="date" :max="today" :class="inputCls" />
        </label>
        <label class="text-[0.625rem] font-bold text-garden-dim">To
          <input v-model="to" type="date" :max="today" :class="inputCls" />
        </label>
      </div>
      <div class="flex flex-wrap gap-1.5 mt-3">
        <button
          v-for="s in shortcuts"
          :key="s.label"
          type="button"
          class="px-2.5 py-1.5 rounded-full border border-garden-border text-[0.625rem] font-bold text-garden-dim hover:text-garden-primary hover:bg-garden-base"
          @click="from = s.from; to = s.to"
        >{{ s.label }}</button>
      </div>
      <p v-if="error" class="text-[0.6875rem] font-semibold text-garden-danger mt-3">{{ error }}</p>
      <p class="text-[0.625rem] text-garden-dim mt-3">Dates in garden time (UTC+8)</p>
      <div class="flex justify-end gap-2 mt-3">
        <button type="button" class="px-3 py-2 rounded-xl border border-garden-border text-xs font-bold text-garden-dim" @click="open = false">Cancel</button>
        <button type="button" class="px-4 py-2 rounded-xl bg-garden-primary text-white text-xs font-bold disabled:opacity-50" :disabled="!!error" @click="apply">Apply</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// v-model: { preset: '7d' | '30d' | 'all' | 'custom', from, to }
// from and to are 'YYYY-MM-DD' in garden time, or null for "All".
import { computed, onMounted, ref } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({ preset: '7d', from: null, to: null }) },
})
const emit = defineEmits(['update:modelValue'])

const TZ = 'Asia/Manila'   // garden time, UTC+8
const PRESETS = [
  { id: '7d', label: '7 days' }, { id: '30d', label: '30 days' },
  { id: 'all', label: 'All' },   { id: 'custom', label: 'Custom' },
]
const inputCls = 'mt-1.5 w-full rounded-xl border border-garden-border bg-garden-surface px-3 py-2 text-xs font-semibold text-garden-text focus:outline-none focus:border-garden-primary'

const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
const iso = (d) => d.toISOString().slice(0, 10)
const parse = (s) => new Date(`${s}T00:00:00Z`)
const addDays = (s, n) => iso(new Date(parse(s).getTime() + n * 86400000))
const firstOfMonth = (s) => `${s.slice(0, 7)}-01`
const lastMonthStart = iso(new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 2, 1)))
const lastMonthEnd = addDays(firstOfMonth(today), -1)

const shortcuts = [
  { label: 'Today',        from: today,                to: today },
  { label: 'Yesterday',    from: addDays(today, -1),   to: addDays(today, -1) },
  { label: 'Last 7 days',  from: addDays(today, -6),   to: today },
  { label: 'Last 30 days', from: addDays(today, -29),  to: today },
  { label: 'This month',   from: firstOfMonth(today),  to: today },
  { label: 'Last month',   from: lastMonthStart,       to: lastMonthEnd },
]

const open = ref(false)
const from = ref(props.modelValue.from || addDays(today, -6))
const to   = ref(props.modelValue.to || today)

const error = computed(() => {
  if (!from.value || !to.value) return 'Choose both a From and To date.'
  if (from.value > to.value) return 'From date must not be after To date.'
  if (to.value > today) return 'Dates cannot be in the future.'
  return ''
})

const fmt = (s) => parse(s).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const chipText = computed(() => {
  const { from: f, to: t } = props.modelValue
  if (!f || !t) return ''
  const days = Math.round((parse(t) - parse(f)) / 86400000) + 1
  return `${fmt(f)} – ${fmt(t)}, ${t.slice(0, 4)} · ${days} day${days === 1 ? '' : 's'}`
})

function resolve(preset) {
  if (preset === '7d')  return { preset, from: addDays(today, -6),  to: today }
  if (preset === '30d') return { preset, from: addDays(today, -29), to: today }
  return { preset: 'all', from: null, to: null }
}
function selectPreset(preset) {
  if (preset === 'custom') { open.value = true; return }
  open.value = false
  emit('update:modelValue', resolve(preset))
}
function apply() {
  if (error.value) return
  emit('update:modelValue', { preset: 'custom', from: from.value, to: to.value })
  open.value = false
}

// A parent may start with { preset: '7d' } only; fill in the dates.
onMounted(() => {
  const m = props.modelValue
  if (m.preset !== 'custom' && m.preset !== 'all' && (!m.from || !m.to)) emit('update:modelValue', resolve(m.preset))
})
</script>