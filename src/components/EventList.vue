<script setup lang="ts">
import { computed } from 'vue'
import { KEY_EVENTS } from '../lib/cosmic'
import type { CosmicEvent } from '../lib/cosmic'
import {
  Sparkles,
  Orbit,
  Sun,
  Globe,
  Dna,
  Footprints,
  Skull,
  User,
  Sprout,
  Scroll,
  Clock,
  Calendar,
  HelpCircle
} from 'lucide-vue-next'

defineProps<{
  currentProgress: number
}>()

const emit = defineEmits<{
  (e: 'select-event', event: CosmicEvent): void
}>()

// Map icon strings to components
const iconMap: Record<string, any> = {
  Sparkles,
  Orbit,
  Sun,
  Globe,
  Dna,
  Footprints,
  Skull,
  User,
  Sprout,
  Scroll,
  Clock
}

function getIcon(name?: string) {
  if (name && iconMap[name]) return iconMap[name]
  return Calendar // Fallback
}

// Find the closest event to highlight
// Spec: "The closest event to the current scrubber should be highlighted automatically."
function isClosest(ev: CosmicEvent, progress: number): boolean {
  // Find dist to this event
  const dist = Math.abs(ev.progress - progress)

  // Find min dist among ALL events
  let minDiff = Infinity
  for (const e of KEY_EVENTS) {
    const d = Math.abs(e.progress - progress)
    if (d < minDiff) minDiff = d
  }

  // Return true if this event is the closest (within rounding margin)
  return Math.abs(dist - minDiff) < 0.0000001
}
</script>

<template>
  <div
    class="h-full bg-space-900/80 backdrop-blur border-l border-white/10 flex flex-col w-64 md:w-80 overflow-hidden transform transition-transform duration-300"
  >
    <div class="p-4 border-b border-white/10 shrink-0 flex items-center gap-2">
      <Calendar class="w-4 h-4 text-cosmic-accent" />
      <h2 class="text-sm uppercase tracking-widest font-bold text-white/90">Key Events</h2>
    </div>

    <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
      <button
        v-for="ev in KEY_EVENTS"
        :key="ev.title"
        class="w-full text-left p-3 rounded-lg transition-all duration-200 border border-transparent group relative flex gap-3 items-start"
        :class="
          isClosest(ev, currentProgress)
            ? 'bg-cosmic-accent/20 border-cosmic-accent/50 text-white'
            : 'hover:bg-white/5 text-white/60 hover:text-white'
        "
        @click="emit('select-event', ev)"
      >
        <div
          class="shrink-0 mt-0.5 p-1.5 rounded-md"
          :class="
            isClosest(ev, currentProgress)
              ? 'bg-cosmic-accent/20 text-cosmic-accent'
              : 'bg-white/5 text-white/40 group-hover:text-white/80'
          "
        >
          <component :is="getIcon(ev.icon)" class="w-4 h-4" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-baseline mb-1">
            <span class="font-bold text-sm truncate">{{ ev.title }}</span>
          </div>
          <div class="text-xs font-mono opacity-60">
            {{ ev.timestampLine }}
          </div>

          <!-- Description (Visible only when selected/closest to keep list clean, 
               or maybe always if brief? Let's show it when closest for 'Educational' focus) -->
          <div
            v-if="isClosest(ev, currentProgress) && ev.description"
            class="mt-2 text-xs text-white/80 leading-relaxed border-t border-white/10 pt-2"
          >
            {{ ev.description }}
          </div>
        </div>

        <!-- Active indicator -->
        <div
          v-if="isClosest(ev, currentProgress)"
          class="absolute left-0 top-0 bottom-0 w-1 bg-cosmic-accent rounded-l-lg"
        ></div>
      </button>

      <!-- Educational Info (in list for mobile compactness, or we can separate) -->
      <div
        class="mt-8 p-4 bg-white/5 rounded-lg border border-white/5 text-xs text-white/70 space-y-2"
      >
        <h3 class="uppercase tracking-wide font-bold text-white mb-2">About this Scale</h3>
        <p>• The entire 13.8 billion year history of the universe is compressed into 1 year.</p>
        <p>• The Big Bang happens at the first second of Jan 1st.</p>
        <p>• Human history occupies only the last few seconds of Dec 31st.</p>
      </div>
    </div>
  </div>
</template>
