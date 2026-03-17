import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export default function VAEDecoder({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y -= delta * 0.15
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={2} wireframe toneMapped={false} />
      </mesh>
      <Html position={[0, -2.5, 0]} center>
        <div className="w-56 p-4 rounded-lg bg-gray-900/80 border border-orange-500 backdrop-blur-sm text-white text-sm">
          <h3 className="font-bold text-orange-400 mb-2">VAE DECODER</h3>
          <p className="text-gray-300 text-xs">Decodifica ruido latente a píxeles.</p>
        </div>
      </Html>
    </group>
  )
}