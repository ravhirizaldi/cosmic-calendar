<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  speed: number
  isPlaying: boolean
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let width = 0
let height = 0
let animationId = 0

interface Star {
  x: number
  y: number
  z: number
  opacity: number
}

const stars: Star[] = []
const STAR_COUNT = 400
const BASE_SPEED = 0.05

function initStars() {
  stars.length = 0
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width - width / 2,
      y: Math.random() * height - height / 2,
      z: Math.random() * width,
      opacity: Math.random()
    })
  }
}

function update() {
  if (!ctx || !canvas.value) return

  // Clear with a very slight fade for trail effect (optional, but clean clear is better for sharp stars)
  ctx.fillStyle = '#0B0D17' // space-800
  ctx.fillRect(-width / 2, -height / 2, width, height)

  // Calculate effective speed
  // When paused, drift slowly (0.5x base).
  // When playing, scale by prop.speed.
  // We clamp/log the speed because 5000x would range the stars instantly.
  // Let's use a log scale or a dampened factor for the visual stars so it looks cool but not broken.
  // actually, let's just let it rip but dampen the multiplier.
  let effectiveSpeed = BASE_SPEED
  // If playing, use props.speed.
  // If NOT playing, only use props.speed if it's NOT one of the static presets (implies scrubbing).
  // This effectively disables "warp preview" when clicking buttons while paused.
  const isPresetSpeed = [0.25, 1, 4, 16, 64, 500, 5000].includes(props.speed)
  const isScrubbing = !props.isPlaying && !isPresetSpeed && props.speed > 4

  if (props.isPlaying || isScrubbing) {
    // Dampen the multiplier: sqrt(speed) helps it feel fast without breaking
    const rawSpeed = BASE_SPEED * (0.5 + Math.sqrt(props.speed))
    // Clamp to avoid crossing entire screen in 1 frame
    const maxSpeed = width / 10 / 20
    effectiveSpeed = Math.min(rawSpeed, maxSpeed)
  } else {
    effectiveSpeed = BASE_SPEED * 0.2 // Slow drift
  }

  // Determine trail length for "smooth" warp effect
  // Streak if playing OR if we are scrubbing (high speed but not preset)
  // If we are just sitting at a high preset speed (paused), NO streaks.
  const shouldShowStreaks = props.isPlaying || isScrubbing

  const warpIntensity = shouldShowStreaks ? Math.max(0, (props.speed - 2) * 2) : 0
  const trailFactor = Math.min(warpIntensity, width * 0.8)

  // Draw stars
  for (const star of stars) {
    // Move star closer
    // If wrapping, we need to be careful not to draw a line across the screen
    const oldZ = star.z
    star.z -= effectiveSpeed * 20

    let didReset = false
    if (star.z <= 0) {
      star.z = width
      star.x = Math.random() * width - width / 2
      star.y = Math.random() * height - height / 2
      didReset = true
    }

    const x = (star.x / star.z) * width
    const y = (star.y / star.z) * height

    // Size depends on distance
    const size = (1 - star.z / width) * 2.5
    const opacity = 1 - star.z / width

    ctx.beginPath()
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`

    // Smooth transition: if trail is significant, draw line
    if (trailFactor > 1.0 && !didReset) {
      // Draw tail
      // Calculate previous position "conceptually" to create the streak
      // We project from a Z that is further back
      const tailZ = star.z + trailFactor
      const tailX = (star.x / tailZ) * width
      const tailY = (star.y / tailZ) * height

      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.lineWidth = size
      ctx.lineCap = 'round'
      ctx.moveTo(x, y)
      ctx.lineTo(tailX, tailY)
      ctx.stroke()
    } else {
      ctx.arc(x, y, size < 0 ? 0 : size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  animationId = requestAnimationFrame(update)
}

function handleResize() {
  if (!canvas.value) return
  width = window.innerWidth
  height = window.innerHeight
  canvas.value.width = width
  canvas.value.height = height

  // Center coordinate system
  if (ctx) ctx.translate(width / 2, height / 2)

  // Re-init stars to cover new area if needed, or just let them loop
}

onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')

  handleResize()
  initStars()
  window.addEventListener('resize', handleResize)

  update()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animationId)
})
</script>

<template>
  <div class="fixed inset-0 z-[-1] overflow-hidden bg-space-900">
    <canvas ref="canvas" class="block w-full h-full opacity-60"></canvas>

    <!-- CSS-based Nebula/Glow layers for depth -->
    <div
      class="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[120px] mix-blend-screen animate-pulse-slow"
    ></div>
    <div
      class="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[100px] mix-blend-screen animate-pulse-slow"
      style="animation-delay: 2s"
    ></div>
  </div>
</template>
