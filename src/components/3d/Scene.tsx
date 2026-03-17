'use client'
import { useMemo, useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, MeshReflectorMaterial, Grid, Float, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

const UNetSphere = dynamic(() => import('./nodes/UNetSphere'), { ssr: false })
const TextEncoder = dynamic(() => import('./nodes/TextEncoder'), { ssr: false })
const VAEDecoder = dynamic(() => import('./nodes/VAEDecoder'), { ssr: false })
const OutputImage = dynamic(() => import('./nodes/OutputImage'), { ssr: false })
const DataFlow = dynamic(() => import('./effects/DataFlow'), { ssr: false })
const InputPrompt = dynamic(() => import('./nodes/InputPrompt'), { ssr: false })

type NodeKey = 'prompt' | 'encoder' | 'unet' | 'vae' | 'output'
type FlowSegment = 'prompt-encoder' | 'encoder-unet' | 'unet-vae' | 'vae-output'

type OrbitControlsHandle = any

interface TourStop {
  position: [number, number, number]
  target: [number, number, number]
  durationToNext: number
  focusNode?: NodeKey | null
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

function CameraDirector({
  controlsRef,
  onFocusNode,
  onComplete
}: {
  controlsRef: { current: OrbitControlsHandle | null }
  onFocusNode: (node: NodeKey | null) => void
  onComplete: () => void
}) {
  const { camera } = useThree()
  const startedAt = useRef<number | null>(null)
  const finished = useRef(false)
  const lastFocusedStop = useRef<number>(-1)

  const stops = useMemo<TourStop[]>(
    () => [
      { position: [0, 8.5, 17], target: [0, 6, -2], durationToNext: 3.2, focusNode: null },
      { position: [-14, 4.1, 9], target: [-11, 1, 0], durationToNext: 2.6, focusNode: 'prompt' },
      { position: [-9, 3.5, 8], target: [-6, 1, 0], durationToNext: 2.4, focusNode: 'encoder' },
      { position: [-3.5, 3.1, 7.5], target: [0, 1, 0], durationToNext: 2.4, focusNode: 'unet' },
      { position: [3.2, 3.4, 7.8], target: [6, 1, 0], durationToNext: 2.5, focusNode: 'vae' },
      { position: [8.4, 3.7, 8.5], target: [11, 1, 0], durationToNext: 2.8, focusNode: 'output' },
      { position: [0, 9.5, 23], target: [0, 1, 0], durationToNext: 0, focusNode: null }
    ],
    []
  )

  const totalDuration = useMemo(
    () => stops.reduce((acc, stop) => acc + stop.durationToNext, 0),
    [stops]
  )

  useFrame((state) => {
    if (finished.current) return

    if (startedAt.current === null) {
      startedAt.current = state.clock.elapsedTime
      lastFocusedStop.current = 0
      onFocusNode(stops[0].focusNode ?? null)
    }

    const elapsedTotal = state.clock.elapsedTime - startedAt.current
    let elapsed = elapsedTotal

    let reachedStop = 0
    let cumulative = 0
    for (let i = 0; i < stops.length - 1; i += 1) {
      cumulative += stops[i].durationToNext
      if (elapsedTotal >= cumulative) reachedStop = i + 1
    }

    if (reachedStop !== lastFocusedStop.current) {
      lastFocusedStop.current = reachedStop
      onFocusNode(stops[reachedStop].focusNode ?? null)
    }

    if (elapsedTotal >= totalDuration) {
      const finalStop = stops[stops.length - 1]
      camera.position.set(...finalStop.position)
      controlsRef.current?.target.set(...finalStop.target)
      controlsRef.current?.update()
      onFocusNode(finalStop.focusNode ?? null)
      finished.current = true
      onComplete()
      return
    }

    let index = 0
    while (index < stops.length - 1 && elapsed > stops[index].durationToNext) {
      elapsed -= stops[index].durationToNext
      index += 1
    }

    const from = stops[index]
    const to = stops[index + 1]
    const segmentDuration = Math.max(from.durationToNext, 0.0001)
    const t = smoothstep(Math.min(elapsed / segmentDuration, 1))

    camera.position.set(
      THREE.MathUtils.lerp(from.position[0], to.position[0], t),
      THREE.MathUtils.lerp(from.position[1], to.position[1], t),
      THREE.MathUtils.lerp(from.position[2], to.position[2], t)
    )

    controlsRef.current?.target.set(
      THREE.MathUtils.lerp(from.target[0], to.target[0], t),
      THREE.MathUtils.lerp(from.target[1], to.target[1], t),
      THREE.MathUtils.lerp(from.target[2], to.target[2], t)
    )
    controlsRef.current?.update()
  })

  return null
}

function TitleSplash() {
  const ref = useRef<HTMLDivElement | null>(null)
  const startedAt = useRef<number | null>(null)

  useFrame((state) => {
    if (startedAt.current === null) startedAt.current = state.clock.elapsedTime
    const elapsed = state.clock.elapsedTime - (startedAt.current || 0)

    if (ref.current) {
      const t = Math.min(elapsed / 0.6, 1)
      const ease = t * t * (3 - 2 * t)
      const scale = 1 + ease * 0.6 // zoom up to ~1.6
      ref.current.style.transform = `scale(${scale})`
      ref.current.style.transition = 'transform 0.03s linear'
    }
  })

  return (
    <Float speed={0.9} rotationIntensity={0.05} floatIntensity={0.35}>
      <Html position={[0, 6, -2]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 8px' }}>
          <div className="epic-text" style={{ fontSize: 'clamp(56px, 10vw, 180px)', letterSpacing: '0.18em', fontWeight: 800 }}>Stable Diffusion</div>
        </div>
      </Html>
    </Float>
  )
}

const NODE_INFO: Record<NodeKey, { title: string; subtitle: string; details: string[] }> = {
  prompt: {
    title: 'Input Prompt',
    subtitle: 'Describe lo que quieres ver',
    details: [
      'Aquí escribes la descripción de la imagen que quieres generar: objetos, estilo, colores y ambiente.',
      'Piensa en palabras clave simples: p. ej. "montañas al atardecer, niebla suave, colores cálidos".',
      'El sistema usa estas palabras para guiar la generación; cuanto más claro seas, más cerca estará el resultado.'
    ]
  },
  encoder: {
    title: 'Text Encoder (CLIP)',
    subtitle: 'Convierte tus palabras en ideas que entiende el modelo',
    details: [
      'Toma el texto que escribiste y lo transforma en una representación interna (una "idea") que entiende el generador.',
      'No es la imagen: es una forma compacta de describir los elementos visuales y su relación.',
      'Esto ayuda al modelo a saber qué priorizar a la hora de crear formas, colores y composición.'
    ]
  },
  unet: {
    title: 'U-Net & Scheduler',
    subtitle: 'El motor que transforma ruido en imagen',
    details: [
      'Empieza con una imagen de ruido y, paso a paso, la va convirtiendo en algo reconocible siguiendo el prompt.',
      'En cada paso el modelo mejora la imagen: añade detalles, corrige formas y refina color y textura.',
      'El "scheduler" es la receta que decide cuántos pasos y cómo aplicar esas correcciones para obtener un resultado estable.'
    ]
  },
  vae: {
    title: 'VAE Decoder',
    subtitle: 'Convierte la representación interna a una imagen visible',
    details: [
      'Toma la representación interna final del modelo y la traduce a píxeles para formar la imagen que ves.',
      'Ajusta colores, bordes y texturas para que la imagen sea coherente y visualmente agradable.',
      'Piensa en esto como el último paso que transforma la idea en una fotografía digital.'
    ]
  },
  output: {
    title: 'Output Image',
    subtitle: 'La imagen final lista para ver o mejorar',
    details: [
      'Este es el resultado: la imagen generada a partir de tu descripción.',
      'Puedes guardarla, retocarla o usarla como base para ampliarla (upscale) o restaurar detalles.',
      'Si no te convence, ajusta el prompt y vuelve a generar para obtener un resultado distinto.'
    ]
  }
}

export default function Scene() {
  const [selectedNode, setSelectedNode] = useState<NodeKey | null>(null)
  const [tourStarted, setTourStarted] = useState(false)
  const [tourFinished, setTourFinished] = useState(false)
  const [coverVisible, setCoverVisible] = useState(true)
  const [coverClosing, setCoverClosing] = useState(false)
  const [focusedNode, setFocusedNode] = useState<NodeKey | null>(null)
  const [pulseTick, setPulseTick] = useState(0)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const controlsRef = useRef<OrbitControlsHandle | null>(null)
  const coverStartTimeoutRef = useRef<number | null>(null)
  const modalInfo = selectedNode ? NODE_INFO[selectedNode] : null

  const activeFlowSegment = useMemo<FlowSegment | null>(() => {
    if (!tourStarted || tourFinished || !focusedNode) return null
    if (focusedNode === 'prompt') return 'prompt-encoder'
    if (focusedNode === 'encoder') return 'encoder-unet'
    if (focusedNode === 'unet') return 'unet-vae'
    if (focusedNode === 'vae') return 'vae-output'
    return null
  }, [focusedNode, tourFinished, tourStarted])

  useEffect(() => {
    if (!tourStarted || !focusedNode) return
    setPulseTick((prev) => prev + 1)
  }, [focusedNode, tourStarted])

  useEffect(() => {
    return () => {
      if (coverStartTimeoutRef.current !== null) {
        window.clearTimeout(coverStartTimeoutRef.current)
      }
    }
  }, [])

  // Pulse the modal title when selectedNode changes
  useEffect(() => {
    if (!titleRef.current) return

    const el = titleRef.current
    // Reset any existing styles
    el.style.transition = 'transform 180ms ease-out, text-shadow 180ms ease-out'
    el.style.transform = 'scale(1.18)'
    el.style.textShadow = '0 0 12px rgba(255,255,255,0.9), 0 0 22px rgba(59,130,246,0.45)'

    const id = window.setTimeout(() => {
      el.style.transform = 'scale(1)'
      el.style.textShadow = 'none'
    }, 220)

    return () => {
      window.clearTimeout(id)
      if (titleRef.current) {
        titleRef.current.style.transform = ''
        titleRef.current.style.textShadow = ''
      }
    }
  }, [selectedNode])

  const handleStartTour = () => {
    if (coverClosing || !coverVisible) return
    setCoverClosing(true)

    coverStartTimeoutRef.current = window.setTimeout(() => {
      setCoverVisible(false)
      setTourStarted(true)
    }, 650)
  }

  return (
    <div className="relative w-full h-screen bg-gray-950">
      <Canvas camera={{ position: [0, 4, 14], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <color attach="background" args={['#030712']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {tourStarted && !tourFinished && (
          <CameraDirector
            controlsRef={controlsRef}
            onFocusNode={setFocusedNode}
            onComplete={() => {
              setTourFinished(true)
              setFocusedNode(null)
            }}
          />
        )}

        <TitleSplash />
        
        <DataFlow activeSegment={activeFlowSegment} />
        
        <InputPrompt
          position={[-11, 1, 0]}
          onClick={() => setSelectedNode('prompt')}
          showLabel={selectedNode === null}
          isActive={focusedNode === 'prompt'}
          pulseTick={pulseTick}
        />
        <TextEncoder
          position={[-6, 1, 0]}
          onClick={() => setSelectedNode('encoder')}
          showLabel={selectedNode === null}
          isActive={focusedNode === 'encoder'}
          pulseTick={pulseTick}
        />
        <UNetSphere
          position={[0, 1, 0]}
          color="#22c55e"
          onClick={() => setSelectedNode('unet')}
          showLabel={selectedNode === null}
          isActive={focusedNode === 'unet'}
          pulseTick={pulseTick}
        />
        <VAEDecoder
          position={[6, 1, 0]}
          onClick={() => setSelectedNode('vae')}
          showLabel={selectedNode === null}
          isActive={focusedNode === 'vae'}
          pulseTick={pulseTick}
        />
        <OutputImage
          position={[11, 1, 0]}
          visible={true}
          onClick={() => setSelectedNode('output')}
          showLabel={selectedNode === null}
          isActive={focusedNode === 'output'}
          pulseTick={pulseTick}
        />
        
        {/* Entorno: Suelo reflectivo y Grilla */}
        <group position={[0, -2.5, 0]}>
          <Grid infiniteGrid fadeDistance={40} fadeStrength={5} sectionColor="#333333" cellColor="#111111" />
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[50, 50]} />
            <MeshReflectorMaterial
              blur={[220, 80]}
              resolution={1024}
              mixBlur={0.9}
              mixStrength={75}
              roughness={0.14}
              depthScale={1.2}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#020617"
              metalness={0.65}
              mirror={0.9}
            />
          </mesh>
        </group>
        
        <EffectComposer enableNormalPass={false}>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
        </EffectComposer>
        
        <OrbitControls
          ref={controlsRef}
          enabled={tourStarted && tourFinished}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={7}
          maxDistance={28}
        />
        <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade />
      </Canvas>

      {coverVisible && (
        <div
          className={`absolute inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-6 backdrop-blur-2xl transition-all duration-700 ease-out ${coverClosing ? 'opacity-0 backdrop-blur-0' : 'opacity-100'}`}
        >
          <button
            type="button"
            onClick={handleStartTour}
            className="w-full max-w-2xl rounded-2xl border border-slate-300/35 bg-slate-900/70 px-8 py-10 text-center text-slate-100 shadow-[0_0_40px_rgba(15,23,42,0.6)] transition hover:border-white/50"
          >
            <h2 className="text-4xl font-black tracking-[0.1em] text-white sm:text-5xl">Stable Diffusion</h2>
            <p className="mt-4 text-sm font-medium uppercase tracking-[0.24em] text-slate-300 sm:text-base">Haz clic para iniciar el recorrido</p>
          </button>
        </div>
      )}

      {modalInfo && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedNode(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-600 bg-slate-900/95 p-6 text-slate-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 ref={titleRef} className="text-2xl font-bold tracking-tight">{modalInfo.title}</h2>
                <p className="mt-1 text-sm text-slate-300">{modalInfo.subtitle}</p>
              </div>
              <button
                className="rounded-lg border border-slate-500 px-3 py-1 text-sm font-medium hover:bg-slate-800"
                onClick={() => setSelectedNode(null)}
              >
                Cerrar
              </button>
            </div>

            <ul className="space-y-2 text-sm leading-relaxed text-slate-200">
              {modalInfo.details.map((detail) => (
                <li key={detail} className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}