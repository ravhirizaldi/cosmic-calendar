<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { KEY_EVENTS, COSMIC_ERAS } from '../lib/cosmic'
import type { CosmicEvent } from '../lib/cosmic'

const props = defineProps<{
  modelValue: number // 0..1
}>()

const trackGradient = computed(() => {
  // Build linear gradient string from eras
  // format: linear-gradient(to right, color1 P1%, color1 P2%, color2 P2%, color2 P3%...)
  // This creates hard stops between eras
  const stops = COSMIC_ERAS.map((era) => {
    const p1 = (era.startProgress * 100).toFixed(2)
    const p2 = (era.endProgress * 100).toFixed(2)
    return `${era.color} ${p1}%, ${era.color} ${p2}%`
  }).join(', ')

  return `linear-gradient(to right, ${stops})`
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'select-event', event: CosmicEvent): void
  (e: 'request-jump', value: number): void
}>()

const container = ref<HTMLElement | null>(null)
const isDragging = ref(false)
let startX = 0
let hasMoved = false

// Tooltip state
const hoveredEra = ref<(typeof COSMIC_ERAS)[0] | null>(null)
const tooltipLeft = ref(0)
const tooltipProgress = ref(0)

function onMouseDown(e: MouseEvent) {
  startX = e.clientX
  hasMoved = false
  isDragging.value = false // Don't start dragging immediately

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  // Update hover state regardless of dragging
  updateHoverState(e)

  if (!isDragging.value) {
    if (Math.abs(e.clientX - startX) > 5) {
      isDragging.value = true
      hasMoved = true
    } else {
      return
    }
  }
  updateFromMouse(e)
}

function onMouseUp(e: MouseEvent) {
  if (!hasMoved && !isDragging.value) {
    // It was a click
    const val = calculateProgress(e)
    if (val !== null) emit('request-jump', val)
  }

  isDragging.value = false
  hasMoved = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

function onMouseLeave() {
  hoveredEra.value = null
}

function updateHoverState(e: MouseEvent) {
  const p = calculateProgress(e)
  if (p === null) return

  tooltipProgress.value = p

  // Find Era
  const era = COSMIC_ERAS.find((e) => p >= e.startProgress && p <= e.endProgress)
  hoveredEra.value = era || null

  // Position
  if (container.value) {
    const rect = container.value.getBoundingClientRect()
    // Relative X for tooltip
    tooltipLeft.value = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  }
}

function calculateProgress(e: MouseEvent): number | null {
  if (!container.value) return null
  const rect = container.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  return x / rect.width
}

function updateFromMouse(e: MouseEvent) {
  const progress = calculateProgress(e)
  if (progress !== null) emit('update:modelValue', progress)
}
</script>

<template>
  <div class="w-full px-4 py-6 select-none relative z-10">
    <!-- Timeline Container -->
    <div
      ref="container"
      class="relative w-full h-12 flex items-center cursor-pointer group"
      @mousedown="onMouseDown"
      @mouseleave="onMouseLeave"
      @mousemove="updateHoverState"
    >
      <!-- Track -->
      <div
        class="absolute w-full h-2 rounded-full overflow-hidden backdrop-blur-sm border border-white/10"
        :style="{ background: trackGradient }"
      >
        <!-- Progress Fill -->
        <div
          class="h-full bg-white/50 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          :style="{ width: `${modelValue * 100}%` }"
        ></div>
      </div>

      <!-- Handle -->
      <div
        class="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-[0_0_20px_white] transform transition-transform duration-75 ease-out hover:scale-125 z-30"
        :class="{ 'scale-125': isDragging }"
        :style="{ left: `${modelValue * 100}%`, transform: 'translate(-50%, -50%)' }"
      >
        <div class="absolute inset-0 bg-cosmic-accent opacity-20 animate-ping rounded-full"></div>
      </div>

      <!-- Era Tooltip (replaces markers) -->
      <div
        v-if="hoveredEra"
        class="absolute bottom-full mb-3 pointer-events-none transform -translate-x-1/2 z-40"
        :style="{ left: tooltipLeft + 'px' }"
      >
        <div
          class="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-2xl flex flex-col gap-0.5 items-center"
        >
          <div
            class="font-bold tracking-wider uppercase text-[10px]"
            :style="{ color: hoveredEra.color }"
          >
            {{ hoveredEra.name }}
          </div>
          <div class="text-white/80 italic font-serif">
            {{ hoveredEra.description }}
          </div>
        </div>
        <!-- Arrow -->
        <div
          class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/10 absolute left-1/2 -translate-x-1/2 bottom-[-6px]"
        ></div>
      </div>
    </div>

    <!-- Labels (Months) -->
    <div
      class="flex justify-between text-[10px] text-white/30 uppercase tracking-widest mt-1 px-1 pointer-events-none"
    >
      <span><span class="md:hidden">01</span><span class="hidden md:inline">Jan</span></span>
      <span><span class="md:hidden">02</span><span class="hidden md:inline">Feb</span></span>
      <span><span class="md:hidden">03</span><span class="hidden md:inline">Mar</span></span>
      <span><span class="md:hidden">04</span><span class="hidden md:inline">Apr</span></span>
      <span><span class="md:hidden">05</span><span class="hidden md:inline">May</span></span>
      <span><span class="md:hidden">06</span><span class="hidden md:inline">Jun</span></span>
      <span><span class="md:hidden">07</span><span class="hidden md:inline">Jul</span></span>
      <span><span class="md:hidden">08</span><span class="hidden md:inline">Aug</span></span>
      <span><span class="md:hidden">09</span><span class="hidden md:inline">Sep</span></span>
      <span><span class="md:hidden">10</span><span class="hidden md:inline">Oct</span></span>
      <span><span class="md:hidden">11</span><span class="hidden md:inline">Nov</span></span>
      <span><span class="md:hidden">12</span><span class="hidden md:inline">Dec</span></span>
      <span>Now</span>
    </div>
  </div>
</template>

<style scoped>
/* Ensure tooltip doesn't get cut off */
.group-hover\/marker\:opacity-100 {
  opacity: 1;
  pointer-events: auto;
}
</style>
