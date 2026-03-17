import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export default function TextEncoder({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
  if (groupRef.current) {
    groupRef.current.rotation.x += delta * 0.12
    groupRef.current.rotation.y += delta * 0.18
    groupRef.current.rotation.z += delta * 0.1
  }
  })

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Núcleo sólido */}
        <mesh>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#1e3a8a" transparent opacity={0.8} />
        </mesh>
        {/* Estructura alámbrica exterior */}
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} wireframe toneMapped={false} />
        </mesh>
      </group>
      <Html position={[0, -2.5, 0]} center>
        <div className="w-56 p-4 rounded-lg bg-gray-900/80 border border-blue-500 backdrop-blur-sm text-white text-sm">
          <h3 className="font-bold text-blue-400 mb-2">TEXT ENCODER (CLIP)</h3>
          <p className="text-gray-300 text-xs">Convierte prompt en Latent Embeddings.</p>
        </div>
      </Html>
    </group>
  )
}