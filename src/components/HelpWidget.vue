<script setup lang="ts">
import { ref } from 'vue'
import { HelpCircle, X, ExternalLink } from 'lucide-vue-next'

const isOpen = ref(false)
</script>

<template>
  <div class="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">
    <!-- Popover Content -->
    <Transition
      enter-active-class="transition duration-200 ease-out origin-bottom-left"
      enter-from-class="opacity-0 scale-90 translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in origin-bottom-left"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-90 translate-y-2"
    >
      <div
        v-if="isOpen"
        class="bg-space-800/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl w-72 shadow-[0_0_30px_rgba(0,0,0,0.5)] text-white/90 mb-2"
      >
        <div class="flex justify-between items-start mb-3">
          <h3 class="font-bold text-lg text-cosmic-glow">Cosmic Calendar</h3>
          <button @click="isOpen = false" class="text-white/40 hover:text-white transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <p class="text-sm text-white/70 leading-relaxed mb-4">
          Visualize the 13.8 billion year history of the universe compressed into a single calendar
          year.
        </p>

        <div class="border-t border-white/10 pt-3 mt-2">
          <div class="text-xs text-white/40 uppercase tracking-widest mb-1">Created By</div>
          <div class="font-bold text-brand-primary flex items-center gap-2">Ravhi Rizaldi</div>
        </div>
      </div>
    </Transition>

    <!-- Toggle Button -->
    <button
      @click="isOpen = !isOpen"
      class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-lg text-white/70 hover:text-white"
      :class="{ 'bg-cosmic-accent text-white border-cosmic-accent/50': isOpen }"
      aria-label="Help & Credits"
    >
      <HelpCircle class="w-5 h-5" />
    </button>
  </div>
</template>
