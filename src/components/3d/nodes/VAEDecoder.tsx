import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export default function VAEDecoder({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
  if (groupRef.current) {
    groupRef.current.rotation.x -= delta * 0.12
    groupRef.current.rotation.y -= delta * 0.18
    groupRef.current.rotation.z -= delta * 0.08
  }
  })

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Núcleo sólido */}
        <mesh>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#7c2d12" transparent opacity={0.8} />
        </mesh>
        {/* Estructura alámbrica exterior */}
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={2} wireframe toneMapped={false} />
        </mesh>
      </group>
      <Html position={[0, -2.5, 0]} center>
        <div className="w-56 p-4 rounded-lg bg-gray-900/80 border border-orange-500 backdrop-blur-sm text-white text-sm">
          <h3 className="font-bold text-orange-400 mb-2">VAE DECODER</h3>
          <p className="text-gray-300 text-xs">Decodifica ruido latente a píxeles.</p>
        </div>
      </Html>
    </group>
  )
}