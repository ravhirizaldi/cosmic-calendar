import { ref, watch, onUnmounted } from 'vue'

/**
 * A composable that tweens a number smoothly to a target value.
 * @param initialValue Starting value
 * @param easeFactor 0.1 to 1.0 (higher = faster snap)
 */
export function useSmoothNumber(initialValue: number, easeFactor = 0.1) {
  const current = ref(initialValue)
  const target = ref(initialValue)
  let rafId: number | null = null

  const loop = () => {
    const diff = target.value - current.value
    
    // If close enough, snap to target
    if (Math.abs(diff) < Number.EPSILON * 1000 || Math.abs(diff) < 0.0001) {
      current.value = target.value
      rafId = null
      return
    }

    current.value += diff * easeFactor
    rafId = requestAnimationFrame(loop)
  }

  // Watch for target changes to start animation
  watch(target, () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(loop)
    }
  })

  // Cleanup
  onUnmounted(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
  })

  return { current, target }
}

/**
 * Similar to useSmoothNumber, but optimized for when the target changes FREQUENTLY (every frame).
 * In this app, the 'progress' changes every frame during playback, but when scrubbing
 * we might want a bit of smoothing or instant following.
 * 
 * For this specific app requirement:
 * "During scrubbing: Use a 'follow target' animation: target value updates instantly, UI value eases toward it"
 * "During playback: Continuous animation updates at 60fps"
 */
export function useFollower(initialValue: number, speed = 0.15) {
  const display = ref(initialValue)
  const actual = ref(initialValue)
  let rafId: number | null = null
  let isActive = true

  const loop = () => {
    if (!isActive) return

    const diff = actual.value - display.value
    // If very small difference, just snap
    if (Math.abs(diff) < 0.0000001) {
      display.value = actual.value
    } else {
      display.value += diff * speed
    }
    
    rafId = requestAnimationFrame(loop)
  }

  rafId = requestAnimationFrame(loop)

  onUnmounted(() => {
    isActive = false
    if (rafId) cancelAnimationFrame(rafId)
  })

  return { display, actual }
}
