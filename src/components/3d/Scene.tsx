'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import UNetSphere from './nodes/UNetSphere'
// ... importar otros nodos

export default function Scene() {
  return (
    <div className="w-full h-screen bg-gray-950">
      <Canvas camera={{ position: [0, 2, 10], fov: 45 }}>
        <color attach="background" args={['#030712']} />
        <ambientLight intensity={0.5} />
        
        {/* Nodos Arquitectura */}
        <UNetSphere position={[0, 0, 0]} color="#22c55e" />
        
        {/* Post-procesamiento para el Glow */}
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
        </EffectComposer>
        
        <OrbitControls enablePan={false} />
        <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade />
      </Canvas>
    </div>
  )
}