
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface NodeProps {
  position: [number, number, number]
  color: string
}

export default function UNetSphere({ position, color }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2
      meshRef.current.rotation.x += delta * 0.1
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={2} // > 1 activa el Bloom
          wireframe
          toneMapped={false} 
        />
      </mesh>

      {/* UI Overlay atado al objeto 3D */}
      <Html position={[0, -2.5, 0]} center>
        <div className="w-64 p-4 rounded-lg bg-gray-900/80 border border-green-500 backdrop-blur-sm text-white text-sm">
          <h3 className="font-bold text-green-400 mb-2">U-NET & SCHEDULER</h3>
          <ul className="list-disc pl-4 space-y-1 text-gray-300">
            <li>Predice y remueve ruido iterativamente.</li>
            <li>Guiado por embeddings del prompt.</li>
          </ul>
        </div>
      </Html>
    </group>
  )
}