<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const props = defineProps<{
  isPlaying: boolean
  speed: number
}>()

const emit = defineEmits<{
  (e: 'loaded'): void
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let model: THREE.Group | null = null
let rafId = 0

// Animation state
// Animation state
let time = 0
let currentIntensity = 0 // 0 = Idle, 1 = Full Warp

function init() {
  if (!canvas.value) return

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  // Limit pixel ratio to 2 to improve performance on high-DPI mobile screens
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  // Removed ToneMapping

  // Scene
  scene = new THREE.Scene()

  // Camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 5
  camera.position.y = 1

  // Lights (Reduced)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
  hemiLight.position.set(0, 20, 0)
  scene.add(hemiLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
  dirLight.position.set(5, 5, 5)
  scene.add(dirLight)

  // Load Model
  const loader = new GLTFLoader()
  loader.load('/models/enterprise/scene.gltf', (gltf) => {
    model = gltf.scene
    // Scale and position adjustments
    model.scale.set(0.05, 0.05, 0.05)
    model.rotation.y = Math.PI * 1.1
    model.rotation.x = 0.1

    // MATERIAL FIX: Force visibility
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const mat = mesh.material as THREE.MeshStandardMaterial

        if (mat) {
          // Reduce reliance on environment maps (reflections)
          // Make it look more "matte" so diffuse texture shows
          mat.metalness = 0.2
          mat.roughness = 0.8

          mat.side = THREE.DoubleSide

          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace
            mat.needsUpdate = true
          }

          if (mat.emissiveMap) {
            mat.emissiveIntensity = 2
            mat.emissive = new THREE.Color(0xffffff)
          }
        }
      }
    })

    scene?.add(model)
    emit('loaded')
  })

  // Resize handler
  window.addEventListener('resize', handleResize)

  // Start loop
  animate()
}

function handleResize() {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  rafId = requestAnimationFrame(animate)
  time += 0.01

  if (model) {
    // 1. Calculate Target Intensity based on Speed
    // 4x starts the transition, 50x is full warp
    let targetIntensity = 0
    if (props.isPlaying && props.speed >= 4) {
      // Map 4..50 to 0..1
      targetIntensity = Math.min(Math.max((props.speed - 4) / 46, 0), 1)
      // Visual curve: Ease out for quicker response
      targetIntensity = 1 - Math.pow(1 - targetIntensity, 3)
    }

    // 2. Smoothly Interpolate (Lerp)
    currentIntensity += (targetIntensity - currentIntensity) * 0.05

    // 3. Calculate Motions

    // Idle Motion
    const idleY = Math.sin(time) * 0.1
    const idleRotZ = Math.sin(time * 0.5) * 0.05

    // Warp Motion (Swing)
    const swaySpeed = 2.0
    const swayAmp = 1.5
    const bankAmp = 0.35

    const warpX = Math.sin(time * swaySpeed) * swayAmp
    const warpRotZ = -Math.cos(time * swaySpeed) * bankAmp
    const warpShakeY = (Math.random() - 0.5) * 0.02 * currentIntensity // Scale shake by intensity

    // 4. Blend & Apply
    // X: 0 -> WarpX
    model.position.x = warpX * currentIntensity

    // Y: Idle -> (Idle + Shake)
    model.position.y = idleY + warpShakeY

    // Rotation Z: IdleRot -> WarpRot
    model.rotation.z = idleRotZ * (1 - currentIntensity) + warpRotZ * currentIntensity
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

onMounted(init)

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(rafId)

  // Dispose Model Resources
  if (scene) {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.geometry.dispose()
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((mat) => {
          mat.dispose()
          // Dispose textures
          const m = mat as THREE.MeshStandardMaterial
          if (m.map) m.map.dispose()
          if (m.emissiveMap) m.emissiveMap.dispose()
        })
      }
    })
  }

  renderer?.dispose()
})
</script>

<template>
  <canvas ref="canvas" class="absolute inset-0 pointer-events-none z-10" />
</template>
