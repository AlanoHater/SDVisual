'use client'
import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, MeshReflectorMaterial, Grid, Text, Float } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import UNetSphere from './nodes/UNetSphere'
import TextEncoder from './nodes/TextEncoder'
import VAEDecoder from './nodes/VAEDecoder'
import OutputImage from './nodes/OutputImage'
import DataFlow from './effects/DataFlow'
import InputPrompt from './nodes/InputPrompt'

type NodeKey = 'prompt' | 'encoder' | 'unet' | 'vae' | 'output'

type OrbitControlsHandle = any

interface TourStop {
  position: [number, number, number]
  target: [number, number, number]
  durationToNext: number
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

function CameraDirector({
  controlsRef,
  onComplete
}: {
  controlsRef: { current: OrbitControlsHandle | null }
  onComplete: () => void
}) {
  const { camera } = useThree()
  const startedAt = useRef<number | null>(null)
  const finished = useRef(false)

  const stops = useMemo<TourStop[]>(
    () => [
      { position: [0, 8.5, 17], target: [0, 6, -2], durationToNext: 2.2 },
      { position: [-14, 4.1, 9], target: [-11, 1, 0], durationToNext: 1.6 },
      { position: [-9, 3.5, 8], target: [-6, 1, 0], durationToNext: 1.4 },
      { position: [-3.5, 3.1, 7.5], target: [0, 1, 0], durationToNext: 1.4 },
      { position: [3.2, 3.4, 7.8], target: [6, 1, 0], durationToNext: 1.5 },
      { position: [8.4, 3.7, 8.5], target: [11, 1, 0], durationToNext: 1.8 },
      { position: [0, 9.5, 23], target: [0, 1, 0], durationToNext: 0 }
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
    }

    let elapsed = state.clock.elapsedTime - startedAt.current

    if (elapsed >= totalDuration) {
      const finalStop = stops[stops.length - 1]
      camera.position.set(...finalStop.position)
      controlsRef.current?.target.set(...finalStop.target)
      controlsRef.current?.update()
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

const NODE_INFO: Record<NodeKey, { title: string; subtitle: string; details: string[] }> = {
  prompt: {
    title: 'Input Prompt',
    subtitle: 'Tokenizacion y condicionamiento textual',
    details: [
      'Se aplica tokenizacion BPE/WordPiece para convertir texto a ids discretos y truncar/pad a longitud fija.',
      'Cada token i se proyecta a embedding e_i y se combina con posicion: h_i = e_i + p_i.',
      'Se generan embeddings condicionales c_pos y no condicionales c_uncond para classifier-free guidance.',
      'CFG mezcla predicciones con: eps_hat = eps(x_t, t, c_uncond) + s * (eps(x_t, t, c_pos) - eps(x_t, t, c_uncond)).',
      'El valor s (guidance scale) controla fidelidad al texto frente a diversidad visual.'
    ]
  },
  encoder: {
    title: 'Text Encoder (CLIP)',
    subtitle: 'Representacion semantica en espacio latente textual',
    details: [
      'El transformer textual produce una secuencia contextualizada H in R^(L x d).',
      'La autoatencion usa: Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V.',
      'U-Net consume H en bloques cross-attention para alinear estructura visual con semantica del prompt.',
      'Embeddings estables mejoran composicion global, relaciones objeto-fondo y coherencia de estilo.'
    ]
  },
  unet: {
    title: 'U-Net + Scheduler',
    subtitle: 'Inferencia difusiva en espacio latente',
    details: [
      'Forward process: q(x_t | x_0) = N(sqrt(alpha_bar_t) x_0, (1 - alpha_bar_t) I).',
      'Reverse model: eps_theta(x_t, t, c) estima ruido para reconstruir x_0 de manera iterativa.',
      'Actualizacion DDPM aproximada: x_(t-1) = 1/sqrt(alpha_t) * (x_t - (1-alpha_t)/sqrt(1-alpha_bar_t) * eps_hat) + sigma_t z.',
      'Schedulers modernos (DDIM, Euler, DPM++) reducen pasos manteniendo detalle y estabilidad numerica.',
      'Cross-attention inyecta condicion textual en resoluciones multiples del U-Net para control semantico fino.'
    ]
  },
  vae: {
    title: 'VAE Decoder',
    subtitle: 'Decodificacion del latente denoised a RGB',
    details: [
      'Stable Diffusion opera en latente z para abaratar coste; VAE decoder mapea z -> x en pixeles.',
      'Reconstruccion entrenada con perdida perceptual + terminos KL para regularizar distribucion latente.',
      'La salida mantiene semantica del prompt mientras recupera color, bordes y textura espacial.',
      'Escalado tipico del latente (por ejemplo 1/0.18215 en SD1.x) se revierte antes de decodificar.'
    ]
  },
  output: {
    title: 'Output Image',
    subtitle: 'Resultado sintetizado listo para postproceso',
    details: [
      'La imagen final integra composicion global + microdetalle aprendido durante el denoising.',
      'Posteriores etapas opcionales: upscaling, face restoration, control por inpainting/outpainting.',
      'Metricas frecuentes de evaluacion: CLIP score, alineacion semantica, nitidez y artefactos estructurales.',
      'Semilla, scheduler y guidance configuran reproducibilidad y estilo final del render.'
    ]
  }
}

export default function Scene() {
  const [selectedNode, setSelectedNode] = useState<NodeKey | null>(null)
  const [tourFinished, setTourFinished] = useState(false)
  const controlsRef = useRef<OrbitControlsHandle | null>(null)
  const modalInfo = selectedNode ? NODE_INFO[selectedNode] : null

  return (
    <div className="relative w-full h-screen bg-gray-950">
      <Canvas camera={{ position: [0, 4, 14], fov: 45 }}>
        <color attach="background" args={['#030712']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {!tourFinished && <CameraDirector controlsRef={controlsRef} onComplete={() => setTourFinished(true)} />}

        <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.5}>
          <Text
            position={[0, 6, -2]}
            color="#e2e8f0"
            fontSize={0.55}
            maxWidth={16}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
          >
            {'Stable Diffusion: pipeline latente condicionado por texto\nque transforma ruido gaussiano en imagen coherente'}
          </Text>
        </Float>
        
        <DataFlow />
        
        <InputPrompt position={[-11, 1, 0]} onClick={() => setSelectedNode('prompt')} />
        <TextEncoder position={[-6, 1, 0]} onClick={() => setSelectedNode('encoder')} />
        <UNetSphere position={[0, 1, 0]} color="#22c55e" onClick={() => setSelectedNode('unet')} />
        <VAEDecoder position={[6, 1, 0]} onClick={() => setSelectedNode('vae')} />
        <OutputImage position={[11, 1, 0]} visible={true} onClick={() => setSelectedNode('output')} />
        
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
          enabled={tourFinished}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={7}
          maxDistance={28}
        />
        <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade />
      </Canvas>

      {modalInfo && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedNode(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-600 bg-slate-900/95 p-6 text-slate-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{modalInfo.title}</h2>
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