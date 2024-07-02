import * as THREE from 'three'
import GUI from 'lil-gui'
import gsap from 'gsap'

/* 
    ============================
    integrate webGL as background of the webpage

*/

/**
 * Debug
 */
const gui = new GUI()

const parameters = {
  materialColor: '#ffffff',
}

gui.addColor(parameters, 'materialColor').onChange((v) => {
  material.color.set(v)
})

/// listen to the change event on already existing tweak and attach the handler to update the material color accordingly
/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/* 
    The MeshToonMaterial wiil have one color for the part in the light and one color for the part in the shade
    we can provide the gradient texture
    gradient images are provided under the `/static/textures/gradients/` folder
    


*/

const textureLoader = new THREE.TextureLoader()
const gradientTexture = textureLoader.load('textures/gradients/3.jpg')
gradientTexture.magFilter = THREE.NearestFilter // pick the nearest over linear

const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
})

/* 
    we're going to create three object for each section to illustrate them.
    To keep things simple, we use Three.js built in object, we can also import custom models into the scene


*/

const objectsDistance = 4

const mesh1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), material)
const mesh2 = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 3, 2), material)
const mesh3 = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
  material
)

mesh1.position.x = 2
mesh2.position.x = -2
mesh3.position.x = 2

mesh2.position.y = -objectsDistance
mesh3.position.y = -objectsDistance * 2

const sectionMeshes = [mesh1, mesh2, mesh3]

scene.add(mesh1, mesh2, mesh3)

/**
 * Lights
 */

const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.position.set(1, 1, 0)
scene.add(directionalLight)

/**
 * Particles
 */

/* 
    first, make sure the particles is showing on screen
    then, we fix the position
    for the x(horizontal) and z (depth), we can use random value that can be as much as positive as they are negative
    for the y (vertical) we need the particles spread far from the the start of the scroll to the end of scroll
*/

// Geometry
const particlesCount = 200
const positions = new Float32Array(particlesCount * 3)

for (let i = 0; i < particlesCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 10
  positions[i * 3 + 1] =
    objectsDistance * 0.5 -
    Math.random() * objectsDistance * sectionMeshes.length
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10
}

const particlesGeometry = new THREE.BufferGeometry()

particlesGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positions, 3)
)

// Material
const particlesMaterial = new THREE.PointsMaterial({
  color: parameters.materialColor,
  sizeAttenuation: true,
  size: 0.03,
})

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Group

const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
)
cameraGroup.add(camera)
camera.position.z = 6

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true, // make canvas transparent to see the background of the webpage
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Scroll
 */

let scrollY = window.scrollY
let currentSection = 0

window.addEventListener('scroll', () => {
  scrollY = window.scrollY

  const newSection = Math.round(scrollY / sizes.height)
  console.log(newSection)
  if (newSection !== currentSection) {
    currentSection = newSection

    gsap.to(sectionMeshes[currentSection].rotation, {
      duration: 1.5,
      ease: 'power2.inOut',
      x: '+=6',
      y: '+=3',
    })
  }
})

/**
 * Cursor
 */

/* 
    We call parallax the action of seeing one object through different observation points.
    When we move the cursor to the left, the camera seems to go to the left. Same thing for the right. But when we move the cursor up, the camera seems to move down and the opposite when moving the cursor down.
*/

const cursor = {
  x: 0,
  y: 0,
}

window.addEventListener('mousemove', (event) => {
  /* 
        1. retrieve the cursor position

        currently, the amplitude depends on the size of the viewport, and the user will different screen resolution wil have different results
        normalize the value (from 0 to 1) by diving them by the size of viewport

        instead of value go from `0` to `1`, better to have value go from `-.5` to `.5`
    */
  cursor.x = event.clientX / window.innerWidth - 0.5
  cursor.y = event.clientY / window.innerHeight - 0.5
  console.log(cursor.x, cursor.y)
})

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
  // same experience for 30, 60, 120 screen frequency
  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime

  for (const mesh of sectionMeshes) {
    mesh.rotation.x += deltaTime * 0.1
    mesh.rotation.y += deltaTime * 0.12
  }

  // update scroll

  // animate the camera
  camera.position.y = (-scrollY / sizes.height) * objectsDistance

  const parallaxX = cursor.x
  const parallaxY = cursor.y

  cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime
  cameraGroup.position.y +=
    (parallaxY - cameraGroup.position.y) * 0.1 * deltaTime

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
