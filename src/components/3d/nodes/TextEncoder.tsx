import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface TextEncoderProps {
  position: [number, number, number]
  onClick?: () => void
}

export default function TextEncoder({ position, onClick }: TextEncoderProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
  if (groupRef.current) {
    groupRef.current.rotation.x += delta * 0.12
    groupRef.current.rotation.y += delta * 0.18
    groupRef.current.rotation.z += delta * 0.1
  }
  })

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
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
      <Html position={[0, 2.2, 0]} center pointerEvents="none">
        <div className="rounded-md border border-blue-500/70 bg-slate-900/80 px-3 py-1 text-xs font-semibold tracking-wide text-blue-300">
          TEXT ENCODER
        </div>
      </Html>
    </group>
  )
}