<template>
  <div class="bg-garden-surface rounded-2xl border border-garden-border shadow-sm overflow-hidden">
    <div class="h-1 bg-garden-primary" />

    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="min-w-0">
        <div class="text-[10px] font-medium tracking-widest uppercase text-garden-dim">Liquid Fertilizer</div>
        <div class="text-sm font-semibold text-garden-text truncate">Scheduled Dispensing (all crops)</div>
      </div>

      <!-- Time window -->
      <div>
        <div class="text-[10px] font-medium tracking-widest uppercase text-garden-dim mb-2">Time Window</div>
        <div v-if="scheduleLoaded" class="flex items-center gap-2">
          <input
            v-model="startTime" type="time" :disabled="readonly"
            class="flex-1 px-3 py-2.5 rounded-xl border border-garden-border font-mono text-sm text-garden-text
                   bg-garden-void focus:outline-none focus:border-garden-primary focus:ring-2 focus:ring-garden-primary/20 transition
                   disabled:opacity-60"
          />
          <span class="text-garden-dim text-sm flex-shrink-0">to</span>
          <input
            v-model="endTime" type="time" :disabled="readonly"
            class="flex-1 px-3 py-2.5 rounded-xl border border-garden-border font-mono text-sm text-garden-text
                   bg-garden-void focus:outline-none focus:border-garden-primary focus:ring-2 focus:ring-garden-primary/20 transition
                   disabled:opacity-60"
          />
        </div>
        <div v-else class="flex items-center gap-2">
          <div class="flex-1 h-[42px] rounded-xl border border-garden-border bg-garden-void animate-pulse" />
          <span class="text-garden-dim text-sm flex-shrink-0">to</span>
          <div class="flex-1 h-[42px] rounded-xl border border-garden-border bg-garden-void animate-pulse" />
        </div>
        <p v-if="scheduleLoaded && crossesMidnight" class="text-[11px] text-garden-dim mt-1.5">ⓘ Window crosses midnight.</p>
      </div>

      <!-- Days (alarm-style toggle) -->
      <div>
        <div class="text-[10px] font-medium tracking-widest uppercase text-garden-dim mb-2">Repeat On</div>
        <div v-if="scheduleLoaded" class="flex gap-1.5">
          <button
            v-for="d in dayList" :key="d.key"
            type="button"
            :disabled="readonly"
            class="w-9 h-9 rounded-full text-xs font-semibold border transition flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            :class="days[d.key]
              ? 'bg-garden-primary text-white border-garden-primary'
              : 'bg-garden-surface text-garden-dim border-garden-border hover:bg-garden-base'"
            @click="days[d.key] = !days[d.key]"
          >{{ d.label }}</button>
        </div>
        <div v-else class="flex gap-1.5">
          <div v-for="i in 7" :key="i" class="w-9 h-9 rounded-full border border-garden-border bg-garden-void animate-pulse" />
        </div>
        <span v-if="daysError" class="block text-[11px] text-garden-danger mt-1.5">{{ daysError }}</span>
      </div>

      <button
        v-if="!readonly"
        class="w-full py-3 rounded-xl bg-garden-primary text-white font-semibold text-sm
               hover:opacity-90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="scheduleSaving || !scheduleLoaded"
        @click="saveSchedule"
      >{{ scheduleSaving ? 'Saving…' : 'Save Schedule' }}</button>

      <p v-else class="text-[11px] text-garden-dim text-center leading-snug">
        Read-only view. Editing is disabled.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { db }                                     from '@/firebase'
import { ref as dbRef, set, onValue }             from 'firebase/database'
import { logActivity }                            from '@/composables/useActivityLog'

const props = defineProps({
  readonly: { type: Boolean, default: false },
})

const dayList = [
  { key: 'sun', label: 'S' },
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
]

const startTime = ref('06:00')
const endTime   = ref('06:15')
const days = reactive({ sun: false, mon: true, tue: false, wed: true, thu: false, fri: true, sat: false })
const scheduleLoaded = ref(false)
const scheduleSaving = ref(false)
const daysError       = ref('')

let unsubSchedule = null

const pad = (n) => n.toString().padStart(2, '0')

const crossesMidnight = computed(() => {
  const [sh, sm] = startTime.value.split(':').map(Number)
  const [eh, em] = endTime.value.split(':').map(Number)
  return (sh * 60 + sm) > (eh * 60 + em)
})

onMounted(() => {
  unsubSchedule = onValue(dbRef(db, 'config/fert_schedule'), (snapshot) => {
    const v = snapshot.val()
    if (v) {
      startTime.value = `${pad(v.startHour ?? 6)}:${pad(v.startMinute ?? 0)}`
      endTime.value   = `${pad(v.endHour ?? 6)}:${pad(v.endMinute ?? 15)}`
      if (v.days) Object.assign(days, v.days)
    }
    scheduleLoaded.value = true
  })

})

onUnmounted(() => {
  if (unsubSchedule) unsubSchedule()
})

async function saveSchedule() {
  daysError.value = ''
  if (!Object.values(days).some(Boolean)) {
    daysError.value = 'Select at least one day.'
    return
  }

  scheduleSaving.value = true
  try {
    const [startHour, startMinute] = startTime.value.split(':').map(Number)
    const [endHour, endMinute]     = endTime.value.split(':').map(Number)

    await set(dbRef(db, 'config/fert_schedule'), {
      startHour, startMinute, endHour, endMinute,
      days: { ...days },
    })
    await set(dbRef(db, 'config/fert_schedule_updated'), Math.floor(Date.now() / 1000))
    logActivity(
      `Fertilizer schedule updated: ${startTime.value}–${endTime.value}`,
      '#3b9dd2', 'schedule'
    )
  } catch (err) {
    console.error('Failed to save fertilizer schedule:', err)
    alert('Failed to save fertilizer schedule. Check console for errors.')
  } finally {
    scheduleSaving.value = false
  }
}
</script>