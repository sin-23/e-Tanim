<template>
  <div class="relative" :style="{ height }">
    <canvas ref="canvas" role="img" :aria-label="ariaLabel" />
  </div>
</template>

<script setup>
// A small Chart.js line chart. Only the parts used are registered, to keep the single-file build small.
// datasets: [{ label, data: [number|null], color: 'garden-var name', dashed?, width?, points? }]
// Colors are CSS variable names (for example 'primary') so the chart follows light and dark mode.
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend,
} from 'chart.js'
import { isDarkMode } from '@/composables/useDarkMode'
import { cssColor } from '@/utils/chartColors'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

const props = defineProps({
  labels:    { type: Array, required: true },
  datasets:  { type: Array, required: true },
  yTitle:    { type: String, default: '' },
  decimals:  { type: Number, default: 1 },
  height:    { type: String, default: '14rem' },
  ariaLabel: { type: String, default: 'Line chart' },
  counts:    { type: Boolean, default: false },   // whole-number counts: axis starts at 0, no fractions
  legend:    { type: Boolean, default: true },
  hoverPoints: { type: Boolean, default: false }, // dots appear only under the pointer
})

const canvas = ref(null)
let chart = null

const css = cssColor

function build() {
  if (!canvas.value) return
  chart?.destroy()
  const text = css('dim')
  const grid = css('border')
  chart = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: props.datasets.map(d => ({
        label: d.label,
        data: d.data,
        borderColor: css(d.color),
        backgroundColor: css(d.color),
        borderWidth: d.width ?? 2,
        borderDash: d.dashed ? [5, 4] : [],
        pointRadius: d.dashed || props.hoverPoints ? 0 : (d.points ?? 2.5),
        pointHoverRadius: d.dashed ? 0 : 4,
        tension: props.counts ? 0 : 0.25,   // counts are whole numbers: straight segments, no overshoot
        borderJoin: 'round',
        borderCapStyle: 'round',
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: css('surface'),
        spanGaps: false,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: props.legend, position: 'bottom', labels: { color: text, boxWidth: 14, boxHeight: 2, font: { size: 10, weight: '600' } } },
        tooltip: {
          // Reference lines are dashed constant datasets; keep them out of the tooltip.
          filter: (item) => !props.datasets[item.datasetIndex]?.dashed,
          callbacks: {
            label: (c) => c.parsed.y === null ? `${c.dataset.label}: no data`
              : `${c.dataset.label}: ${c.parsed.y.toFixed(props.decimals)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: text, maxRotation: 0, autoSkip: true, font: { size: 10 }, ...(props.counts ? { maxTicksLimit: 10 } : {}) },
          grid: { color: grid, display: !props.counts },   // no vertical gridlines on the count charts
        },
        y: {
          beginAtZero: props.counts,
          ticks: { color: text, font: { size: 10 }, ...(props.counts ? { precision: 0 } : {}) }, grid: { color: grid },
          title: { display: !!props.yTitle, text: props.yTitle, color: text, font: { size: 10, weight: '700' } },
        },
      },
    },
  })
}

onMounted(build)
watch(() => [props.labels, props.datasets, props.yTitle], build, { deep: true })
watch(isDarkMode, () => requestAnimationFrame(build))   // wait for the .dark class to apply
onBeforeUnmount(() => chart?.destroy())
</script>