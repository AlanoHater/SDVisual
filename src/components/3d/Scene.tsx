'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, MeshReflectorMaterial, Grid } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import UNetSphere from './nodes/UNetSphere'
import TextEncoder from './nodes/TextEncoder'
import VAEDecoder from './nodes/VAEDecoder'
import OutputImage from './nodes/OutputImage'
import DataFlow from './effects/DataFlow'
import InputPrompt from './nodes/InputPrompt'

export default function Scene() {
  return (
    <div className="w-full h-screen bg-gray-950">
      <Canvas camera={{ position: [0, 4, 14], fov: 45 }}>
        <color attach="background" args={['#030712']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <DataFlow />
        
        <InputPrompt position={[-11, 1, 0]} />
        <TextEncoder position={[-6, 1, 0]} />
        <UNetSphere position={[0, 1, 0]} color="#22c55e" />
        <VAEDecoder position={[6, 1, 0]} />
        <OutputImage position={[11, 1, 0]} />
        
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
    </div>
  )
}