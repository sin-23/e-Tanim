<template>
  <BaseModal :open="open" :title="`Snapshot · ${fruitId}`" :eyebrow="cropLabel" @close="$emit('close')">
    <div class="p-5 space-y-4">
      <div class="text-[0.625rem] text-garden-dim">
        {{ entryLabelText }} · {{ formatDateTime(entry.timestamp) }}
      </div>

      <!-- Image area: sized for a small crop (640 px at most), no bounding box -->
      <div class="flex items-center justify-center min-h-40 rounded-xl border border-garden-border bg-garden-base p-3">
        <div v-if="state === 'loading'" class="text-xs text-garden-dim animate-pulse" aria-busy="true">Loading snapshot…</div>
        <img
          v-else-if="state === 'loaded'"
          :src="url"
          :alt="`${cropLabel} ${fruitId}, ${entry.stage}`"
          class="max-h-72 max-w-full rounded-lg object-contain"
          @error="state = 'error'"
        />
        <div v-else class="text-center max-w-xs">
          <div class="text-sm font-bold" :class="isProblem ? 'text-garden-danger' : 'text-garden-text'">{{ headline }}</div>
          <p class="text-xs text-garden-dim mt-1">{{ detail }}</p>
        </div>
      </div>

      <div v-if="canRequest || state === 'requesting'" class="space-y-2">
        <button
          type="button"
          class="w-full py-2.5 rounded-xl bg-garden-primary text-white text-xs font-bold disabled:opacity-50"
          :disabled="!requestAllowed || state === 'requesting'"
          @click="sendRequest"
        >{{ state === 'requesting' ? 'Requesting…' : state === 'timedout' || state === 'failed' ? 'Request snapshot again' : 'Request snapshot' }}</button>
        <p v-if="blockedReason" class="text-[0.625rem] text-garden-warn-ink">{{ blockedReason }}</p>
        <p v-else-if="typeof requestsLeft === 'number'" class="text-[0.625rem] text-garden-dim">{{ requestsLeft }} requests left today</p>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import { formatDateTime } from '@/utils/formatTime'
import { loadSnapshotUrl, requestSnapshot, entryLabel, REQUEST_TIMEOUT_MS } from '@/composables/useSnapshots'

const props = defineProps({
  open:          { type: Boolean, default: false },
  crop:          { type: String, required: true },     // crop id, e.g. tomato
  cropLabel:     { type: String, default: '' },
  fruitId:       { type: String, required: true },
  entries:       { type: Array,  default: () => [] },  // the fruit's entries, oldest first
  entry:         { type: Object, required: true },     // the entry being viewed
  requestsByPath: { type: Object, default: () => ({}) },
  miniPc:        { type: Object, default: () => ({ loaded: false, online: false }) },
  // No data source yet (checklist 13.7): shown only when a number is given.
  requestsLeft:  { type: Number, default: null },
})
defineEmits(['close'])

// loading | loaded | missing | pending | timedout | requesting | failed | error | unavailable | none
const state = ref('loading')
const url = ref('')
const now = ref(Date.now())
const tick = setInterval(() => { now.value = Date.now() }, 15000)
onUnmounted(() => clearInterval(tick))

const entryLabelText = computed(() => {
  const i = props.entries.findIndex(e => e.id === props.entry.id)
  return i >= 0 ? entryLabel(props.entries, i) : 'Snapshot'
})

const request = computed(() => (props.entry.framePath ? props.requestsByPath[props.entry.framePath] : null))
const requestAge = computed(() => (request.value ? now.value - request.value.requestedAt : 0))

async function load() {
  url.value = ''
  if (!props.entry.framePath) { state.value = 'none'; return }
  state.value = 'loading'
  const res = await loadSnapshotUrl(props.entry.framePath)
  if (res.status === 'loaded') { url.value = res.url; state.value = 'loaded'; return }
  state.value = res.status === 'missing' ? 'missing' : res.status
}

watch(() => [props.open, props.entry.id, props.entry.framePath], ([o]) => { if (o) load() }, { immediate: true })

// While the image is missing, follow the request: pending, timed out, or done.
const missingState = computed(() => {
  if (!request.value) return 'missing'
  return requestAge.value < REQUEST_TIMEOUT_MS ? 'pending' : 'timedout'
})
watch(missingState, (next, prev) => {
  // The Mini PC deletes the request after uploading, so pending -> missing means try again.
  if (prev === 'pending' && next === 'missing' && ['missing', 'pending'].includes(state.value)) load()
  if (['missing', 'pending', 'timedout'].includes(state.value)) state.value = next
})
watch(state, (s) => {
  if (s === 'missing') state.value = missingState.value
})

const canRequest = computed(() => ['missing', 'timedout', 'failed'].includes(state.value) && !!props.entry.framePath)
const miniPcDown = computed(() => props.miniPc.loaded && !props.miniPc.online)
const limitReached = computed(() => props.requestsLeft === 0)
const requestAllowed = computed(() => !miniPcDown.value && !limitReached.value)
const blockedReason = computed(() => {
  if (miniPcDown.value) return 'The Mini PC is offline. Request the snapshot again when it is back.'
  if (limitReached.value) return 'The daily request limit is reached. Try again tomorrow.'
  return ''
})

const isProblem = computed(() => ['timedout', 'failed', 'error', 'unavailable'].includes(state.value))
const headline = computed(() => ({
  missing:     'Not in the cloud',
  pending:     'Snapshot requested',
  timedout:    'The request timed out',
  failed:      'Could not send the request',
  error:       'Could not load the snapshot',
  unavailable: 'Snapshots are not available',
  none:        'No snapshot for this entry',
}[state.value] || ''))
const detail = computed(() => ({
  missing:     'This image was not uploaded automatically, or it was removed to save space. Request it from the Mini PC.',
  pending:     request.value ? `Already requested ${formatDateTime(request.value.requestedAt)}. It appears here when the Mini PC has uploaded it.` : 'It appears here when the Mini PC has uploaded it.',
  timedout:    'The Mini PC did not upload the image in time. Request it again.',
  failed:      'Check the connection and try again.',
  error:       'Check the connection and try again.',
  unavailable: 'Cloud Storage is not set up for this unit.',
  none:        'This entry has no image path.',
}[state.value] || ''))

async function sendRequest() {
  if (!requestAllowed.value) return
  state.value = 'requesting'
  const ok = await requestSnapshot({
    crop: props.crop,
    fruitId: props.fruitId,
    entryId: props.entry.id,
    framePath: props.entry.framePath,
  })
  state.value = ok ? 'pending' : 'failed'
}
</script>