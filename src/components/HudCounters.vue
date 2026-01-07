<script setup lang="ts">
import { computed, watch } from 'vue'
import { useFollower } from '../lib/animate'
import {
  getCosmicYears,
  getCalendarDateComponents,
  COSMIC_SCALE,
  formatNumber,
  MONTH_NAMES
} from '../lib/cosmic'

const props = defineProps<{
  progress: number
  isPlaying: boolean
}>()

// Use 'follower' for smooth animation on scrub, but instant enough for playback
// Using a slightly faster speed to feel responsive
const { display: smoothProgress, actual: targetProgress } = useFollower(props.progress, 0.2)

watch(
  () => props.progress,
  (val) => {
    // If jump is large, snap (likely a seek or travel end)
    const diff = Math.abs(val - targetProgress.value)
    if (diff > 0.01) {
      targetProgress.value = val
      smoothProgress.value = val
    } else {
      targetProgress.value = val
    }
  },
  { immediate: true }
)

// Derived animated values
const cosmicYears = computed(() => getCosmicYears(smoothProgress.value))
const calendarComponents = computed(() => getCalendarDateComponents(smoothProgress.value))

// Format Date
// Format Date
const formattedDate = computed(() => {
  const { m, day, hour, minute, second } = calendarComponents.value
  const month = MONTH_NAMES[m]
  const d = day.toString().padStart(2, '0')
  const h = hour.toString().padStart(2, '0')
  const min = minute.toString().padStart(2, '0')
  const s = second.toFixed(3).padStart(6, '0')

  return { month, day: d, time: `${h}:${min}:${s}` }
})
</script>

<template>
  <div class="pointer-events-none w-[95%] md:w-full mx-auto md:mx-auto max-w-3xl z-20 mt-4 md:mt-0">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      <!-- Primary HUD: Date & Years -->
      <div
        class="bg-space-800/80 backdrop-blur-md border border-white/10 rounded-xl p-6 md:p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
      >
        <!-- Cosmic Date -->
        <div class="border-b border-white/10 pb-4 md:pb-3 mb-4 md:mb-3">
          <div
            class="text-xs md:text-[10px] uppercase tracking-[0.2em] text-cosmic-glow mb-2 md:mb-1"
          >
            Cosmic Date
          </div>
          <div
            class="flex flex-col md:flex-row md:items-baseline space-y-2 md:space-y-0 md:space-x-3 text-white"
          >
            <span class="text-5xl md:text-4xl font-bold font-mono tracking-tighter tabular-nums">
              {{ formattedDate.month }} {{ formattedDate.day }}
            </span>
            <span class="text-2xl md:text-xl font-mono text-white/70 tabular-nums">
              {{ formattedDate.time }}
            </span>
          </div>
        </div>

        <!-- Years Since Big Bang -->
        <div>
          <div class="text-xs md:text-[10px] uppercase tracking-[0.2em] text-blue-400 mb-2 md:mb-1">
            Time After Big Bang
          </div>
          <div
            class="text-2xl md:text-3xl font-bold text-white tracking-tight tabular-nums font-mono flex flex-wrap items-baseline gap-2"
          >
            <span>{{ formatNumber(cosmicYears) }}</span>
            <span class="text-base md:text-sm font-sans font-normal text-white/50 whitespace-nowrap"
              >Years</span
            >
          </div>
        </div>
      </div>

      <!-- Scale Reference (Fixed) -->
      <div
        class="bg-space-800/60 backdrop-blur-sm border border-white/5 rounded-xl p-6 md:p-4 hidden md:flex flex-col justify-center"
      >
        <div class="text-xs md:text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">
          Scale Reference
        </div>
        <div class="space-y-2 font-mono text-sm md:text-xs">
          <div class="flex justify-between items-center text-white/80 border-b border-white/5 pb-1">
            <span>1 Calendar Day</span>
            <span class="text-cosmic-glow">≈ 37.8 Million Years</span>
          </div>
          <div class="flex justify-between items-center text-white/80 border-b border-white/5 pb-1">
            <span>1 Calendar Hour</span>
            <span class="text-cosmic-glow">≈ 1.6 Million Years</span>
          </div>
          <div class="flex justify-between items-center text-white/80 border-b border-white/5 pb-1">
            <span>1 Calendar Minute</span>
            <span class="text-cosmic-glow">≈ 26,000 Years</span>
          </div>
          <div class="flex justify-between items-center text-white/80">
            <span>1 Calendar Second</span>
            <span class="text-cosmic-glow">≈ 437 Years</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
