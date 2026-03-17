'use client'
import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, MeshReflectorMaterial, Grid } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import UNetSphere from './nodes/UNetSphere'
import TextEncoder from './nodes/TextEncoder'
import VAEDecoder from './nodes/VAEDecoder'
import OutputImage from './nodes/OutputImage'
import DataFlow from './effects/DataFlow'
import InputPrompt from './nodes/InputPrompt'

type NodeKey = 'prompt' | 'encoder' | 'unet' | 'vae' | 'output'

const NODE_INFO: Record<NodeKey, { title: string; subtitle: string; details: string[] }> = {
  prompt: {
    title: 'Input Prompt',
    subtitle: 'Texto y conceptos visuales',
    details: [
      'El prompt define escena, estilo, luz y nivel de detalle.',
      'Se tokeniza y cada token pasa al encoder de texto.',
      'Prompt positivo y negativo influyen en la guía final.'
    ]
  },
  encoder: {
    title: 'Text Encoder (CLIP)',
    subtitle: 'Tokens -> embeddings semánticos',
    details: [
      'Convierte palabras en vectores numéricos (embeddings).',
      'Estos embeddings condicionan el proceso de denoising.',
      'La similitud semántica guía qué contenido aparece en la imagen.'
    ]
  },
  unet: {
    title: 'U-Net + Scheduler',
    subtitle: 'Denoising iterativo del latente',
    details: [
      'Comienza con ruido gaussiano en el espacio latente.',
      'U-Net predice ruido residual en cada paso temporal t.',
      'Scheduler aplica la ecuación de actualización: x_{t-1} = f(x_t, eps_theta(x_t, t, c)).'
    ]
  },
  vae: {
    title: 'VAE Decoder',
    subtitle: 'Latente limpio -> píxeles',
    details: [
      'Toma el latente denoised final y lo decodifica a RGB.',
      'Reconstruye estructura global y texturas finas.',
      'Entrega la imagen final en el espacio de píxeles.'
    ]
  },
  output: {
    title: 'Output Image',
    subtitle: 'Resultado final generado',
    details: [
      'Representa la imagen sintetizada por el pipeline SD.',
      'Integra composición, color y detalle del prompt.',
      'Puede usarse como base para upscaling o postprocesado.'
    ]
  }
}

export default function Scene() {
  const [selectedNode, setSelectedNode] = useState<NodeKey | null>(null)
  const modalInfo = selectedNode ? NODE_INFO[selectedNode] : null

  return (
    <div className="relative w-full h-screen bg-gray-950">
      <Canvas camera={{ position: [0, 4, 14], fov: 45 }}>
        <color attach="background" args={['#030712']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
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
              blur={[300, 100]}
              resolution={1024}
              mixBlur={1}
              mixStrength={50}
              roughness={0.2}
              depthScale={1.2}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#050505"
              metalness={0.5}
              mirror={0.5}
            />
          </mesh>
        </group>
        
        <EffectComposer enableNormalPass={false}>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
        </EffectComposer>
        
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2 - 0.05} />
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