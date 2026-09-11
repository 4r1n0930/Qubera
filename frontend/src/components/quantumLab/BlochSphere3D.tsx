import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RotateCcw, Eye, Compass } from 'lucide-react'
import type { QubitVisualization, QSphereBasisState } from '../../utils/blochMath'
import { formatCoord, phaseToColor, QUBIT_PALETTE } from '../../utils/blochMath'

export interface HoveredStateInfo {
  type: 'qubit' | 'basis'
  label: string
  qubitIndex?: number
  prob?: number
  amplitudeStr?: string
  phaseDeg?: number
  phaseRad?: number
  color?: string
  coords?: [number, number, number]
  purity?: number
}

interface BlochSphere3DProps {
  mode: 'bloch' | 'qsphere'
  qubits: QubitVisualization[]
  selectedQubit: number | 'all'
  basisStates: QSphereBasisState[]
  numQubits: number
  onSelectQubit?: (q: number) => void
}

/** Create a high-res crisp text sprite for 3D coordinate and ket labels. */
function createTextSprite(
  text: string,
  textColor: string,
  fontSize = 36,
  backgroundColor?: string
): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor
      const radius = 24
      const x = 16
      const y = 20
      const w = canvas.width - 32
      const h = canvas.height - 40
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + w - radius, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
      ctx.lineTo(x + w, y + h - radius)
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
      ctx.lineTo(x + radius, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()
    }

    ctx.font = `600 ${fontSize}px Inter, system-ui, -apple-system, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = textColor
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(spriteMaterial)
  sprite.scale.set(0.48, 0.24, 1)
  return sprite
}

const DEFAULT_CAMERA_POS: [number, number, number] = [2.2, 1.8, 3.2]

export function BlochSphere3D({
  mode,
  qubits,
  selectedQubit,
  basisStates,
  numQubits,
  onSelectQubit,
}: BlochSphere3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const animFrameRef = useRef<number>(0)

  // Interactive dynamic object group
  const dynamicGroupRef = useRef<THREE.Group | null>(null)
  const raycastObjectsRef = useRef<THREE.Object3D[]>([])

  const [hovered, setHovered] = useState<HoveredStateInfo | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  // ------------------------------------------------------------------
  //  Scene Initialization
  // ------------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 400
    const height = container.clientHeight || 400

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50)
    camera.position.set(...DEFAULT_CAMERA_POS)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 1.4
    controls.maxDistance = 7.0
    controls.rotateSpeed = 0.85
    controlsRef.current = controls

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 1.4)
    scene.add(ambLight)

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6)
    dirLight1.position.set(4, 6, 5)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.8)
    dirLight2.position.set(-4, -5, -4)
    scene.add(dirLight2)

    // Static Bloch Sphere Geometry
    const staticGroup = new THREE.Group()

    // 1. Translucent glass sphere
    const sphereGeo = new THREE.SphereGeometry(1, 48, 32)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.12,
      roughness: 0.3,
      metalness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat)
    staticGroup.add(sphereMesh)

    // 2. Parallels (latitudes: ±30°, ±60°)
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.35,
    })
    const equatorMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    })

    const latDegs = [-60, -30, 0, 30, 60]
    latDegs.forEach((lat) => {
      const phi = (lat * Math.PI) / 180
      const r = Math.cos(phi)
      const z = Math.sin(phi)
      const points: THREE.Vector3[] = []
      for (let t = 0; t <= Math.PI * 2 + 0.05; t += 0.1) {
        // In physics: Z is vertical
        points.push(new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), z))
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(geom, lat === 0 ? equatorMat : lineMat)
      staticGroup.add(line)
    })

    // 3. Meridians (longitudes: 0°, 45°, 90°, 135°)
    const lonDegs = [0, 45, 90, 135]
    lonDegs.forEach((lon) => {
      const az = (lon * Math.PI) / 180
      const points: THREE.Vector3[] = []
      for (let t = 0; t <= Math.PI * 2 + 0.05; t += 0.08) {
        const x = Math.cos(az) * Math.cos(t)
        const y = Math.sin(az) * Math.cos(t)
        const z = Math.sin(t)
        points.push(new THREE.Vector3(x, y, z))
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(geom, lineMat)
      staticGroup.add(line)
    })

    // 4. Subtle equatorial disc
    const discGeo = new THREE.CircleGeometry(1, 48)
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const discMesh = new THREE.Mesh(discGeo, discMat)
    staticGroup.add(discMesh)

    // 5. 3D Coordinate Axes (+X, -X, +Y, -Y, +Z, -Z)
    const axisLen = 1.3
    const axisMatX = new THREE.LineBasicMaterial({ color: 0xf43f5e, opacity: 0.85, transparent: true })
    const axisMatY = new THREE.LineBasicMaterial({ color: 0x10b981, opacity: 0.85, transparent: true })
    const axisMatZ = new THREE.LineBasicMaterial({ color: 0x38bdf8, opacity: 0.85, transparent: true })

    // X Axis
    const geoX = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-axisLen, 0, 0),
      new THREE.Vector3(axisLen, 0, 0),
    ])
    staticGroup.add(new THREE.Line(geoX, axisMatX))

    // Y Axis
    const geoY = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -axisLen, 0),
      new THREE.Vector3(0, axisLen, 0),
    ])
    staticGroup.add(new THREE.Line(geoY, axisMatY))

    // Z Axis
    const geoZ = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -axisLen),
      new THREE.Vector3(0, 0, axisLen),
    ])
    staticGroup.add(new THREE.Line(geoZ, axisMatZ))

    // Arrow cones for axes
    const coneGeo = new THREE.ConeGeometry(0.04, 0.1, 16)
    const coneMatX = new THREE.MeshBasicMaterial({ color: 0xf43f5e })
    const coneMatY = new THREE.MeshBasicMaterial({ color: 0x10b981 })
    const coneMatZ = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })

    const coneX = new THREE.Mesh(coneGeo, coneMatX)
    coneX.position.set(axisLen, 0, 0)
    coneX.rotation.z = -Math.PI / 2
    staticGroup.add(coneX)

    const coneY = new THREE.Mesh(coneGeo, coneMatY)
    coneY.position.set(0, axisLen, 0)
    staticGroup.add(coneY)

    const coneZ = new THREE.Mesh(coneGeo, coneMatZ)
    coneZ.position.set(0, 0, axisLen)
    coneZ.rotation.x = Math.PI / 2
    staticGroup.add(coneZ)

    // Cardinal Labels
    const labels = [
      { text: '|0⟩ (+Z)', pos: [0, 0, 1.42], color: '#38bdf8' },
      { text: '|1⟩ (-Z)', pos: [0, 0, -1.42], color: '#94a3b8' },
      { text: '|+⟩ (+X)', pos: [1.45, 0, 0], color: '#f43f5e' },
      { text: '|−⟩ (-X)', pos: [-1.45, 0, 0], color: '#94a3b8' },
      { text: '|+i⟩ (+Y)', pos: [0, 1.45, 0], color: '#10b981' },
      { text: '|-i⟩ (-Y)', pos: [0, -1.45, 0], color: '#94a3b8' },
    ] as const

    labels.forEach((l) => {
      const sprite = createTextSprite(l.text, l.color, 32, 'rgba(15, 23, 42, 0.65)')
      sprite.position.set(l.pos[0], l.pos[1], l.pos[2])
      staticGroup.add(sprite)
    })

    scene.add(staticGroup)

    // Dynamic object group for interactive vectors / basis states
    const dynamicGroup = new THREE.Group()
    scene.add(dynamicGroup)
    dynamicGroupRef.current = dynamicGroup

    // Animation Loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  // ------------------------------------------------------------------
  //  Dynamic Content Re-generation (Bloch Vectors or Q-Sphere)
  // ------------------------------------------------------------------
  useEffect(() => {
    const group = dynamicGroupRef.current
    if (!group) return

    // Clear previous dynamic objects
    while (group.children.length > 0) {
      const obj = group.children[0]
      group.remove(obj)
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    }
    raycastObjectsRef.current = []

    if (mode === 'bloch') {
      // ---------------- Multi-Vector Bloch Mode ----------------
      const displayQubits = selectedQubit === 'all'
        ? qubits
        : qubits.filter((_, idx) => idx === selectedQubit)

      displayQubits.forEach((qInfo, index) => {
        const qIndex = selectedQubit === 'all' ? index : (selectedQubit as number)
        const qColor = QUBIT_PALETTE[qIndex % QUBIT_PALETTE.length]
        const phaseColorStr = phaseToColor(qInfo.phiDeg * (Math.PI / 180))

        const targetVec = new THREE.Vector3(qInfo.x, qInfo.y, qInfo.z)
        const len = targetVec.length()
        const isMixed = len < 1e-4

        if (isMixed) {
          // Mixed state at center (e.g. entangled qubit)
          const centerGeo = new THREE.SphereGeometry(0.06, 16, 16)
          const centerMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(qColor),
            emissive: new THREE.Color(qColor),
            emissiveIntensity: 0.6,
            roughness: 0.3,
          })
          const centerMesh = new THREE.Mesh(centerGeo, centerMat)
          centerMesh.userData = {
            type: 'qubit',
            qubitIndex: qIndex,
            label: `q${qIndex} (Mixed)`,
            purity: qInfo.purity,
            coords: [qInfo.x, qInfo.y, qInfo.z],
            color: qColor,
          }
          group.add(centerMesh)
          raycastObjectsRef.current.push(centerMesh)

          const mixedSprite = createTextSprite(
            `q${qIndex}: mixed (r=0)`,
            qColor,
            30,
            'rgba(15, 23, 42, 0.75)'
          )
          mixedSprite.position.set(0.18, (qIndex - (numQubits - 1) / 2) * 0.16, 0.1)
          group.add(mixedSprite)
          return
        }

        // Vector shaft (cylinder from origin to vector tip)
        const shaftRadius = selectedQubit === 'all' ? 0.016 : 0.022
        const shaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, len, 16)
        shaftGeo.translate(0, len / 2, 0)
        shaftGeo.rotateX(Math.PI / 2)

        const shaftMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(phaseColorStr),
          emissive: new THREE.Color(phaseColorStr),
          emissiveIntensity: 0.45,
          roughness: 0.2,
          metalness: 0.1,
        })
        const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat)
        shaftMesh.lookAt(targetVec)
        group.add(shaftMesh)

        // Arrowhead cone
        const coneRadius = shaftRadius * 2.6
        const coneHeight = 0.14
        const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 20)
        coneGeo.translate(0, coneHeight / 2, 0)
        coneGeo.rotateX(Math.PI / 2)

        const coneMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(phaseColorStr),
          emissive: new THREE.Color(phaseColorStr),
          emissiveIntensity: 0.7,
          roughness: 0.2,
        })
        const coneMesh = new THREE.Mesh(coneGeo, coneMat)
        coneMesh.position.copy(targetVec)
        coneMesh.lookAt(targetVec.clone().multiplyScalar(1.5))
        group.add(coneMesh)

        // Glowing tip sphere for raycasting
        const tipGeo = new THREE.SphereGeometry(shaftRadius * 2.2, 16, 16)
        const tipMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
        const tipMesh = new THREE.Mesh(tipGeo, tipMat)
        tipMesh.position.copy(targetVec)
        tipMesh.userData = {
          type: 'qubit',
          qubitIndex: qIndex,
          label: `q${qIndex}`,
          prob: qInfo.purity,
          phaseDeg: qInfo.phiDeg,
          coords: [qInfo.x, qInfo.y, qInfo.z],
          color: phaseColorStr,
          purity: qInfo.purity,
        }
        group.add(tipMesh)
        raycastObjectsRef.current.push(tipMesh)

        // Label sprite near tip
        const labelSprite = createTextSprite(
          `q${qIndex}`,
          '#ffffff',
          32,
          qColor
        )
        const labelOffset = targetVec.clone().normalize().multiplyScalar(len + 0.18)
        labelSprite.position.copy(labelOffset)
        group.add(labelSprite)

        // Equatorial projection guide (for selected or single view)
        if (selectedQubit !== 'all' || qubits.length <= 3) {
          // Vertical drop line to equator
          const dropGeo = new THREE.BufferGeometry().setFromPoints([
            targetVec,
            new THREE.Vector3(qInfo.x, qInfo.y, 0),
          ])
          const dropMat = new THREE.LineDashedMaterial({
            color: 0x94a3b8,
            dashSize: 0.04,
            gapSize: 0.03,
            transparent: true,
            opacity: 0.6,
          })
          const dropLine = new THREE.Line(dropGeo, dropMat)
          dropLine.computeLineDistances()
          group.add(dropLine)

          // Foot marker on equator
          const footGeo = new THREE.SphereGeometry(0.02, 12, 12)
          const footMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
          const footMesh = new THREE.Mesh(footGeo, footMat)
          footMesh.position.set(qInfo.x, qInfo.y, 0)
          group.add(footMesh)

          // Phase Arc along equator from +X to (x, y, 0)
          const arcRadius = Math.sqrt(qInfo.x * qInfo.x + qInfo.y * qInfo.y)
          if (arcRadius > 0.08) {
            const arcPts: THREE.Vector3[] = []
            const targetPhi = (qInfo.phiDeg * Math.PI) / 180
            const step = (targetPhi / 20) || 0.05
            for (let a = 0; a <= targetPhi; a += Math.abs(step)) {
              arcPts.push(new THREE.Vector3(arcRadius * 0.4 * Math.cos(a), arcRadius * 0.4 * Math.sin(a), 0))
            }
            if (arcPts.length > 1) {
              const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts)
              const arcMat = new THREE.LineBasicMaterial({
                color: new THREE.Color(phaseColorStr),
                linewidth: 2,
                transparent: true,
                opacity: 0.9,
              })
              group.add(new THREE.Line(arcGeo, arcMat))
            }
          }
        }
      })
    } else {
      // ---------------- Circuit State Q-Sphere Mode ----------------
      basisStates.forEach((state) => {
        const prob = state.probability
        const targetPos = new THREE.Vector3(state.x, state.y, state.z)
        const isNonZero = prob > 0.0005

        if (isNonZero) {
          // Radial spoke connecting origin to basis node
          const spokeGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            targetPos,
          ])
          const spokeMat = new THREE.LineBasicMaterial({
            color: state.hexColor,
            transparent: true,
            opacity: 0.75,
          })
          group.add(new THREE.Line(spokeGeo, spokeMat))

          // Node sphere sized by amplitude magnitude
          const nodeRadius = Math.max(0.045, Math.min(0.22, 0.05 + Math.sqrt(prob) * 0.16))
          const nodeGeo = new THREE.SphereGeometry(nodeRadius, 24, 24)
          const nodeMat = new THREE.MeshStandardMaterial({
            color: state.hexColor,
            emissive: state.hexColor,
            emissiveIntensity: 0.45,
            roughness: 0.2,
            metalness: 0.1,
          })
          const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat)
          nodeMesh.position.copy(targetPos)
          nodeMesh.userData = {
            type: 'basis',
            label: `|${state.label}⟩`,
            prob,
            amplitudeStr: `${formatCoord(state.amplitude.real)} ${state.amplitude.imag < 0 ? '−' : '+'} ${formatCoord(Math.abs(state.amplitude.imag))}i`,
            phaseDeg: state.phaseDeg,
            phaseRad: state.phaseRad,
            color: state.color,
            coords: [state.x, state.y, state.z],
          }
          group.add(nodeMesh)
          raycastObjectsRef.current.push(nodeMesh)

          // Ket label sprite
          const ketSprite = createTextSprite(
            `|${state.label}⟩`,
            '#ffffff',
            32,
            'rgba(15, 23, 42, 0.75)'
          )
          const offsetPos = targetPos.clone().normalize().multiplyScalar(1 + nodeRadius + 0.12)
          ketSprite.position.copy(offsetPos)
          group.add(ketSprite)
        } else {
          // Faint basis lattice anchor for 0-probability state
          const faintGeo = new THREE.SphereGeometry(0.02, 10, 10)
          const faintMat = new THREE.MeshBasicMaterial({
            color: 0x64748b,
            transparent: true,
            opacity: 0.35,
          })
          const faintMesh = new THREE.Mesh(faintGeo, faintMat)
          faintMesh.position.copy(targetPos)
          faintMesh.userData = {
            type: 'basis',
            label: `|${state.label}⟩`,
            prob: 0,
            amplitudeStr: '0.0000 + 0.0000i',
            phaseDeg: 0,
            phaseRad: 0,
            color: state.color,
            coords: [state.x, state.y, state.z],
          }
          group.add(faintMesh)
          raycastObjectsRef.current.push(faintMesh)
        }
      })
    }
  }, [mode, qubits, selectedQubit, basisStates, numQubits])

  // ------------------------------------------------------------------
  //  Interactive Raycasting (Hover inspection)
  // ------------------------------------------------------------------
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current
    const camera = cameraRef.current
    if (!container || !camera) return

    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

    const intersects = raycaster.intersectObjects(raycastObjectsRef.current, false)
    if (intersects.length > 0) {
      const top = intersects[0].object
      const info = top.userData as HoveredStateInfo
      setHovered(info)
      setTooltipPos({
        x: Math.min(rect.width - 200, Math.max(10, e.clientX - rect.left + 12)),
        y: Math.min(rect.height - 120, Math.max(10, e.clientY - rect.top + 12)),
      })
    } else {
      setHovered(null)
      setTooltipPos(null)
    }
  }, [])

  const handlePointerLeave = useCallback(() => {
    setHovered(null)
    setTooltipPos(null)
  }, [])

  // Camera reset presets
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return
    cameraRef.current.position.set(...DEFAULT_CAMERA_POS)
    cameraRef.current.lookAt(0, 0, 0)
    controlsRef.current.reset()
  }, [])

  const viewFromTop = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return
    cameraRef.current.position.set(0, 0, 3.4)
    cameraRef.current.lookAt(0, 0, 0)
    controlsRef.current.update()
  }, [])

  const viewFromFront = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return
    cameraRef.current.position.set(3.4, 0, 0)
    cameraRef.current.lookAt(0, 0, 0)
    controlsRef.current.update()
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = mountRef.current
      const camera = cameraRef.current
      if (!container || !camera || !onSelectQubit) return

      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      const intersects = raycaster.intersectObjects(raycastObjectsRef.current, false)
      if (intersects.length > 0) {
        const top = intersects[0].object
        const data = top.userData as HoveredStateInfo
        if (data.type === 'qubit' && typeof data.qubitIndex === 'number') {
          onSelectQubit(data.qubitIndex)
        }
      }
    },
    [onSelectQubit]
  )

  return (
    <div
      className="qlab-bloch-3d-wrapper"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      <div ref={mountRef} className="qlab-bloch-3d-canvas" />

      {/* 3D Camera Controls HUD */}
      <div className="qlab-3d-hud-controls">
        <button
          type="button"
          className="qlab-3d-hud-btn"
          onClick={resetCamera}
          title="Reset 3D camera view"
          aria-label="Reset 3D view"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="qlab-3d-hud-btn"
          onClick={viewFromTop}
          title="Top view (+Z / |0⟩)"
          aria-label="Top view"
        >
          <Compass size={13} />
          <span>Top (+Z)</span>
        </button>
        <button
          type="button"
          className="qlab-3d-hud-btn"
          onClick={viewFromFront}
          title="Front view (+X / |+⟩)"
          aria-label="Front view"
        >
          <Eye size={13} />
          <span>Front (+X)</span>
        </button>
      </div>

      {/* Floating 3D Hover Tooltip */}
      {hovered && tooltipPos && (
        <div
          className="qlab-3d-tooltip"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <div className="qlab-3d-tooltip-head">
            <span
              className="qlab-3d-tooltip-dot"
              style={{ backgroundColor: hovered.color || '#38bdf8' }}
            />
            <strong className="qlab-3d-tooltip-label">{hovered.label}</strong>
          </div>
          <div className="qlab-3d-tooltip-body">
            {hovered.prob !== undefined && (
              <div className="qlab-3d-tooltip-row">
                <span>{hovered.type === 'basis' ? 'Prob' : 'Purity'}:</span>
                <code>{(hovered.prob * 100).toFixed(1)}%</code>
              </div>
            )}
            {hovered.amplitudeStr && (
              <div className="qlab-3d-tooltip-row">
                <span>Amp:</span>
                <code>{hovered.amplitudeStr}</code>
              </div>
            )}
            {hovered.phaseDeg !== undefined && (
              <div className="qlab-3d-tooltip-row">
                <span>Phase:</span>
                <code>{hovered.phaseDeg.toFixed(1)}°</code>
              </div>
            )}
            {hovered.coords && (
              <div className="qlab-3d-tooltip-row">
                <span>Coords:</span>
                <code>
                  ({formatCoord(hovered.coords[0], 2)}, {formatCoord(hovered.coords[1], 2)},{' '}
                  {formatCoord(hovered.coords[2], 2)})
                </code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Phase Color Scale Legend HUD */}
      <div className="qlab-phase-legend">
        <div className="qlab-phase-legend-header">
          <span className="qlab-phase-legend-title">Phase φ (Color Map)</span>
          {hovered?.phaseDeg !== undefined && (
            <span className="qlab-phase-legend-val" style={{ color: hovered.color }}>
              {hovered.phaseDeg.toFixed(0)}°
            </span>
          )}
        </div>
        <div className="qlab-phase-bar-track">
          <div className="qlab-phase-bar-gradient" />
          {hovered?.phaseDeg !== undefined && (
            <div
              className="qlab-phase-indicator"
              style={{
                left: `${(hovered.phaseDeg / 360) * 100}%`,
                backgroundColor: hovered.color,
              }}
            />
          )}
        </div>
        <div className="qlab-phase-labels">
          <span>0 (0°)</span>
          <span>π/2 (90°)</span>
          <span>π (180°)</span>
          <span>3π/2 (270°)</span>
          <span>2π</span>
        </div>
      </div>
    </div>
  )
}
