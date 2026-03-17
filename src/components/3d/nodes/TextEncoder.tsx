import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export default function TextEncoder({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.15
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} wireframe toneMapped={false} />
      </mesh>
      <Html position={[0, -2.5, 0]} center>
        <div className="w-56 p-4 rounded-lg bg-gray-900/80 border border-blue-500 backdrop-blur-sm text-white text-sm">
          <h3 className="font-bold text-blue-400 mb-2">TEXT ENCODER (CLIP)</h3>
          <p className="text-gray-300 text-xs">Convierte prompt en Latent Embeddings.</p>
        </div>
      </Html>
    </group>
  )
}