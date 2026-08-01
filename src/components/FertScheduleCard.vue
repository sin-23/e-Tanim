<template>
  <div class="bg-white rounded-2xl border border-garden-border shadow-sm overflow-hidden">
    <div class="h-1 bg-garden-primary" />

    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0">
          <div class="text-[10px] font-medium tracking-widest uppercase text-garden-dim">Dual Fertilizer System</div>
          <div class="text-sm font-semibold text-garden-text truncate">Shared Schedule</div>
        </div>
        <span
          class="px-2.5 py-1 rounded-full text-[10px] font-semibold border flex-shrink-0"
          :style="activeSource === 'organic'
            ? { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }
            : { backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' }"
        >{{ activeSource === 'organic' ? 'ORGANIC (Storebought) ACTIVE' : 'LEACHATE (FFJ) ACTIVE' }}</span>
      </div>

      <!-- Source selector -->
      <div>
        <div class="text-[10px] font-medium tracking-widest uppercase text-garden-dim mb-2">
          Fertilizer Source <span class="normal-case font-normal">— only this pump will fire on schedule</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            class="py-2.5 rounded-xl border text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            :class="activeSource === 'leachate'
              ? 'bg-[#2d7a4f] text-white border-[#2d7a4f]'
              : 'bg-white text-garden-text border-garden-border hover:bg-garden-base'"
            :disabled="readonly || sourceSaving"
            @click="setSource('leachate')"
          >Leachate (FFJ)</button>
          <button
            class="py-2.5 rounded-xl border text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            :class="activeSource === 'organic'
              ? 'bg-[#3b9dd2] text-white border-[#3b9dd2]'
              : 'bg-white text-garden-text border-garden-border hover:bg-garden-base'"
            :disabled="readonly || sourceSaving"
            @click="setSource('organic')"
          >Organic Fertilizer (Storebought)</button>
        </div>
      </div>

      <!-- Time window -->
      <div>
        <div class="text-[10px] font-medium tracking-widest uppercase text-garden-dim mb-2">Time Window</div>
        <div class="flex items-center gap-2">
          <input
            v-model="startTime" type="time" :disabled="readonly"
            class="flex-1 px-3 py-2.5 rounded-xl border border-garden-border font-mono text-sm text-garden-text
                   bg-[#f4f8f5] focus:outline-none focus:border-garden-primary focus:ring-2 focus:ring-garden-primary/20 transition
                   disabled:opacity-60"
          />
          <span class="text-garden-dim text-sm flex-shrink-0">to</span>
          <input
            v-model="endTime" type="time" :disabled="readonly"
            class="flex-1 px-3 py-2.5 rounded-xl border border-garden-border font-mono text-sm text-garden-text
                   bg-[#f4f8f5] focus:outline-none focus:border-garden-primary focus:ring-2 focus:ring-garden-primary/20 transition
                   disabled:opacity-60"
          />
        </div>
        <p v-if="crossesMidnight" class="text-[11px] text-garden-dim mt-1.5">ⓘ Window crosses midnight.</p>
      </div>

      <!-- Days (alarm-style toggle) -->
      <div>
        <div class="text-[10px] font-medium tracking-widest uppercase text-garden-dim mb-2">Repeat On</div>
        <div class="flex gap-1.5">
          <button
            v-for="d in dayList" :key="d.key"
            type="button"
            :disabled="readonly"
            class="w-9 h-9 rounded-full text-xs font-semibold border transition flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            :class="days[d.key]
              ? 'bg-garden-primary text-white border-garden-primary'
              : 'bg-white text-garden-dim border-garden-border hover:bg-garden-base'"
            @click="days[d.key] = !days[d.key]"
          >{{ d.label }}</button>
        </div>
        <span v-if="daysError" class="block text-[11px] text-garden-danger mt-1.5">{{ daysError }}</span>
      </div>

      <button
        v-if="!readonly"
        class="w-full py-3 rounded-xl bg-garden-primary text-white font-semibold text-sm
               hover:opacity-90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="scheduleSaving"
        @click="saveSchedule"
      >{{ scheduleSaving ? 'Saving…' : 'Save Schedule' }}</button>

      <p v-else class="text-[11px] text-garden-dim text-center leading-snug">
        Log in to edit the fertilizer schedule or source.
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
const activeSource   = ref('leachate')
const scheduleSaving = ref(false)
const sourceSaving   = ref(false)
const daysError       = ref('')

let unsubSchedule = null
let unsubSource   = null

const pad = (n) => n.toString().padStart(2, '0')

const crossesMidnight = computed(() => {
  const [sh, sm] = startTime.value.split(':').map(Number)
  const [eh, em] = endTime.value.split(':').map(Number)
  return (sh * 60 + sm) > (eh * 60 + em)
})

onMounted(() => {
  unsubSchedule = onValue(dbRef(db, 'config/fert_schedule'), (snapshot) => {
    const v = snapshot.val()
    if (!v) return
    startTime.value = `${pad(v.startHour ?? 6)}:${pad(v.startMinute ?? 0)}`
    endTime.value   = `${pad(v.endHour ?? 6)}:${pad(v.endMinute ?? 15)}`
    if (v.days) Object.assign(days, v.days)
  })

  unsubSource = onValue(dbRef(db, 'config/fert_active_source'), (snapshot) => {
    const v = snapshot.val()
    if (v === 'leachate' || v === 'organic') activeSource.value = v
  })
})

onUnmounted(() => {
  if (unsubSchedule) unsubSchedule()
  if (unsubSource)   unsubSource()
})

async function setSource(source) {
  if (props.readonly || sourceSaving.value) return
  const previous = activeSource.value
  activeSource.value = source
  sourceSaving.value = true
  try {
    await set(dbRef(db, 'config/fert_active_source'), source)
    await set(dbRef(db, 'config/fert_active_source_updated'), Math.floor(Date.now() / 1000))
    logActivity(
      `Fertilizer source switched to ${source === 'organic' ? 'Organic Fertilizer (Storebought)' : 'Compost Leachate (FFJ)'}`,
      '#3b9dd2', 'source'
    )
  } catch (err) {
    activeSource.value = previous
    console.error('Failed to switch fertilizer source:', err)
    alert('Failed to switch fertilizer source. Check console for errors.')
  } finally {
    sourceSaving.value = false
  }
}

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