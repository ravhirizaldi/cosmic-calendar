<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import Starfield from './components/Starfield.vue'
import SpaceShip from './components/SpaceShip.vue'
import Timeline from './components/Timeline.vue'
import HudCounters from './components/HudCounters.vue'
import EventList from './components/EventList.vue'
import HelpWidget from './components/HelpWidget.vue'
import type { CosmicEvent } from './lib/cosmic'
import { Ty_seconds } from './lib/cosmic'
import { Play, Pause, Menu, X, Rocket, Zap, Gauge } from 'lucide-vue-next'

// State
const progress = ref(0) // 0..1
const isPlaying = ref(false)
const showEvents = ref(false) // for mobile toggle

const speeds = [0.25, 1, 4, 16, 64, 500, 5000] // Extended for usability
const currentSpeed = ref(1)

let rafId = 0
let lastTime = 0

function togglePlay() {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

function play() {
  if (progress.value >= 1) return
  isPlaying.value = true
  lastTime = performance.now()
  rafId = requestAnimationFrame(loop)
}

function pause() {
  isPlaying.value = false
  cancelAnimationFrame(rafId)
}

function loop(time: number) {
  if (!isPlaying.value) return

  const dt = (time - lastTime) / 1000 // delta in seconds
  lastTime = time

  // Calculate increment
  // speed = cosmic seconds per real second
  // progress = current_cosmic_seconds / total_seconds_in_year
  const textSpeed = currentSpeed.value
  // I'll add a multiplier 'BASE_RATE' because 1 cosmic sec/sec is too slow for "visualizing the universe".
  // Let's scale it so '1x' is visually interesting.
  // Actually, if we want to see the "clock" tick, 1x (1 sec/sec) is good.
  // It just takes a year to finish.
  // I will just use the value as is. Scrubbing is the main navigation.
  const incrementSeconds = dt * currentSpeed.value
  const incrementProgress = incrementSeconds / Ty_seconds

  progress.value += incrementProgress

  if (progress.value >= 1) {
    progress.value = 1
    pause()
  } else {
    rafId = requestAnimationFrame(loop)
  }
}

const isTravelMode = ref(false)
const previousSpeed = ref(1)

// Loading State
const isLoading = ref(true)

function onShipLoaded() {
  console.log('Ship loaded')
  // Small artificial delay to prevent flash if it loads instantly
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}

function onEventSelect(ev: CosmicEvent) {
  flyToProgress(ev.progress)
}

function flyToProgress(target: number) {
  // ... existing flyToProgress implementation ...
  if (isTravelMode.value) return
  if (isPlaying.value) pause()
  cancelAnimationFrame(rafId)
  isTravelMode.value = true
  previousSpeed.value = currentSpeed.value || 1
  isPlaying.value = true
  const start = progress.value
  const dist = target - start
  const duration = 2.0
  let startTime = performance.now()
  function travelLoop(time: number) {
    const elapsed = (time - startTime) / 1000
    const p = Math.min(elapsed / duration, 1)
    const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
    const nextProgress = start + dist * ease
    const deltaProgress = nextProgress - progress.value
    progress.value = nextProgress
    if (p < 0.99) {
      const effectiveTravelSpeed = (Math.abs(deltaProgress) * Ty_seconds) / 0.016
      currentSpeed.value = Math.max(effectiveTravelSpeed, 0)
    }
    if (p < 1) {
      rafId = requestAnimationFrame(travelLoop)
    } else {
      progress.value = target
      isTravelMode.value = false
      isPlaying.value = false
      currentSpeed.value = previousSpeed.value
      cancelAnimationFrame(rafId)
    }
  }
  rafId = requestAnimationFrame(travelLoop)
}

// Velocity calculation for manual scrubbing
let lastScrubTime = 0
let lastScrubProgress = 0
let scrubResetTimer: any = null

watch(progress, (newP, oldP) => {
  // If we are playing or traveling, speed is managed elsewhere
  if (isPlaying.value || isTravelMode.value) return

  const now = performance.now()
  const dt = (now - lastScrubTime) / 1000
  lastScrubTime = now

  // If dt is huge (first move), skip
  if (dt > 0.5) {
    lastScrubProgress = newP
    return
  }

  // Calculate speed: deltaProgress / dt = progress_per_second
  // Convert to cosmic seconds: speed * Ty_seconds
  const dp = Math.abs(newP - lastScrubProgress)
  lastScrubProgress = newP

  if (dt > 0.001) {
    const rawSpeed = (dp * Ty_seconds) / dt
    // Smooth it or just set it? Start with set
    // We only want to visualize "fast" scrubbing
    if (rawSpeed > 50) {
      currentSpeed.value = rawSpeed

      // Reset after stop
      if (scrubResetTimer) clearTimeout(scrubResetTimer)
      scrubResetTimer = setTimeout(() => {
        // Smoothly return to 1? or just snap. Snap is fine for now.
        currentSpeed.value = 1
      }, 100)
    }
  }
})
</script>

<template>
  <div class="flex flex-col h-screen w-full relative overflow-hidden text-white font-sans">
    <!-- Loading Overlay -->
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-700 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isLoading"
        class="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center font-mono pointer-events-auto"
      >
        <div class="flex flex-col items-center gap-4 animate-pulse">
          <Rocket class="w-12 h-12 text-white/80 animate-bounce" />
          <div class="text-white/60 tracking-[0.2em] uppercase text-sm">Calibrating Sensors...</div>
        </div>
      </div>
    </Transition>

    <!-- Background -->
    <Starfield :speed="currentSpeed" :is-playing="isPlaying" />

    <!-- 3D Ship Overlay -->
    <SpaceShip :speed="currentSpeed" :is-playing="isPlaying" @loaded="onShipLoaded" />

    <!-- Top Bar: Timeline -->
    <div
      class="h-24 md:h-32 shrink-0 z-30 bg-gradient-to-b from-space-900 via-space-900/80 to-transparent pt-4"
    >
      <!-- App Title (Mobile only mostly) -->
      <div
        class="md:hidden text-center text-xs uppercase tracking-[0.3em] font-bold text-white/30 mb-2"
      >
        Cosmic Calendar
      </div>
      <Timeline v-model="progress" @request-jump="flyToProgress" />
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex min-h-0 relative z-20">
      <!-- Center Stage (HUD) -->
      <main
        class="flex-1 relative flex flex-col items-center justify-center p-4 gap-8 md:gap-12 pointer-events-none"
      >
        <HudCounters
          :progress="progress"
          :is-playing="isPlaying"
          class="pointer-events-auto w-full flex justify-center"
        />

        <!-- Playback Controls -->
        <div
          class="pointer-events-auto flex flex-col items-center gap-4 md:gap-4 p-6 md:p-6 bg-space-800/80 md:bg-space-800/40 backdrop-blur-xl rounded-2xl border border-white/10 md:border-white/5 mx-auto w-[95%] md:w-auto md:max-w-none"
        >
          <div class="flex flex-col md:flex-row items-center gap-6 md:gap-8 w-full md:w-auto">
            <button
              @click="togglePlay"
              class="w-20 h-20 md:w-16 md:h-16 shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95 border border-white/10"
            >
              <Play v-if="!isPlaying" class="ml-1 w-10 h-10 md:w-8 md:h-8 fill-current" />
              <Pause v-else class="w-10 h-10 md:w-8 md:h-8 fill-current" />
            </button>

            <div class="flex flex-col gap-3 w-full md:w-auto overflow-hidden">
              <label
                class="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50 font-bold ml-1 justify-center md:justify-start"
              >
                <Gauge class="w-4 h-4" /> Time Speed
              </label>
              <!-- Scrollable Speed Selector for Mobile -->
              <div
                class="flex flex-wrap justify-center gap-2 bg-black/40 rounded-xl p-2 border border-white/5 w-full md:w-auto md:max-w-none mx-auto md:mx-0"
              >
                <button
                  v-for="s in speeds"
                  :key="s"
                  @click="currentSpeed = s"
                  class="px-4 py-2 text-sm rounded-lg transition-colors font-mono flex items-center gap-1 whitespace-nowrap shrink-0 flex-grow md:flex-grow-0 justify-center"
                  :class="
                    currentSpeed === s
                      ? 'bg-cosmic-accent text-white shadow-lg'
                      : 'text-white/40 hover:text-white/80'
                  "
                >
                  <Rocket v-if="s >= 500" class="w-4 h-4" />
                  <Zap v-else-if="s >= 16" class="w-4 h-4" />
                  {{ s >= 1000 ? s / 1000 + 'k' : s }}x
                </button>
              </div>
            </div>
          </div>

          <div
            class="text-[10px] md:text-xs text-center text-white/30 font-mono hidden md:block pt-2 border-t border-white/5 w-full"
          >
            {{ isPlaying ? `Advancing ${currentSpeed} cosmic seconds per real second` : 'Paused' }}
          </div>
        </div>
      </main>

      <!-- Sidebar (Desktop) -->
      <aside class="hidden lg:block h-full z-20">
        <EventList :current-progress="progress" @select-event="onEventSelect" />
      </aside>

      <!-- Mobile Toggle Button -->
      <button
        @click="showEvents = !showEvents"
        class="lg:hidden absolute bottom-6 right-6 w-12 h-12 rounded-full bg-cosmic-accent text-white shadow-lg z-50 flex items-center justify-center border border-white/20"
      >
        <Menu class="w-6 h-6" />
      </button>

      <!-- Interaction Lock Overlay during Warp Travel -->
      <div
        v-if="isTravelMode"
        class="fixed inset-0 z-[100] cursor-wait bg-black/10 backdrop-blur-[1px]"
        @click.stop.prevent
        @mousedown.stop.prevent
        @touchstart.stop.prevent
      >
        <!-- Optional: Could add a "Warping..." text or icon here later -->
      </div>
    </div>
    <!-- Help / Credits Widget -->
    <HelpWidget />
  </div>

  <!-- Mobile Event Drawer (Moved to root for correct Z-index stacking) -->
  <div
    class="fixed inset-y-0 right-0 w-80 bg-space-900 z-[60] transform transition-transform duration-300 lg:hidden shadow-2xl border-l border-white/10"
    :class="showEvents ? 'translate-x-0' : 'translate-x-full'"
  >
    <button
      @click="showEvents = false"
      class="absolute top-4 right-4 text-white/50 hover:text-white p-2"
    >
      <X class="w-6 h-6" />
    </button>
    <div class="h-full pt-12">
      <EventList
        :current-progress="progress"
        @select-event="
          (ev) => {
            onEventSelect(ev)
            showEvents = false
          }
        "
      />
    </div>
  </div>
</template>
