import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface OutputImageProps {
  position: [number, number, number]
  visible: boolean
  onClick?: () => void
}

export default function OutputImage({ position, visible, onClick }: OutputImageProps) {
  const meshRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const frameRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1
    }
    
    // Lerp para fundido de opacidad
    if (materialRef.current && frameRef.current) {
      const targetOpacity = visible ? 1 : 0
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, delta * 2)
      frameRef.current.opacity = THREE.MathUtils.lerp(frameRef.current.opacity, targetOpacity, delta * 2)
    }
  })

  return (
    <group
      position={position}
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      <mesh>
        <planeGeometry args={[2.5, 2.5]} />
        <meshStandardMaterial ref={materialRef} color="#ffffff" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2.6, 2.6, 0.1]} />
        <meshStandardMaterial ref={frameRef} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} transparent opacity={0} toneMapped={false} />
      </mesh>

      <Html position={[0, 2.2, 0]} center style={{ transition: 'opacity 1s', opacity: visible ? 1 : 0, pointerEvents: 'none' }}>
        <div className="rounded-md border border-white/70 bg-slate-900/80 px-3 py-1 text-xs font-semibold tracking-wide text-white">
          OUTPUT IMAGE
        </div>
      </Html>
    </group>
  )
}