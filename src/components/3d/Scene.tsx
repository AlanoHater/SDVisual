'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import UNetSphere from './nodes/UNetSphere'
// import TextEncoder from './nodes/TextEncoder'
// import VAEDecoder from './nodes/VAEDecoder'
// import DataFlow from './effects/DataFlow'

export default function Scene() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 2, 12], fov: 45 }}>
        <color attach="background" args={['#030712']} />
        <ambientLight intensity={0.5} />
        
        {/* Flujo de datos */}
        {/* <DataFlow /> */}

        {/* Nodos de la Arquitectura */}
        {/* <TextEncoder position={[-5, 0, 0]} /> */}
        <UNetSphere position={[0, 0, 0]} color="#22c55e" />
        {/* <VAEDecoder position={[5, 0, 0]} /> */}
        
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
        </EffectComposer>
        
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2} />
        <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade />
      </Canvas>
    </div>
  )
}