import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface NodeProps {
  position: [number, number, number]
  color: string
  onClick?: () => void
}

const CustomGeometryParticles = ({ count, shape, color }: { count: number; shape: "box" | "sphere"; color: string }) => {
  const points = useRef<THREE.Points>(null!)

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)

    if (shape === "box") {
      for (let i = 0; i < count; i++) {
        // Escala 3 para coincidir con el diámetro de la esfera
        let x = (Math.random() - 0.5) * 3
        let y = (Math.random() - 0.5) * 3
        let z = (Math.random() - 0.5) * 3

        positions.set([x, y, z], i * 3)
      }
    }

    if (shape === "sphere") {
      const distance = 1.5 // Radio ajustado al tamaño original
      
      for (let i = 0; i < count; i++) {
        const theta = THREE.MathUtils.randFloatSpread(360)
        const phi = THREE.MathUtils.randFloatSpread(360)

        let x = distance * Math.sin(theta) * Math.cos(phi)
        let y = distance * Math.sin(theta) * Math.sin(phi)
        let z = distance * Math.cos(theta)

        positions.set([x, y, z], i * 3)
      }
    }

    return positions
  }, [count, shape])

  // Rotación constante para simular el autoRotate original
  useFrame((_, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * 0.2
      points.current.rotation.x += delta * 0.1
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.03} 
        color={color} 
        sizeAttenuation 
        depthWrite={false} 
        transparent 
        opacity={0.9} 
      />
    </points>
  )
}

export default function UNetSphere({ position, color, onClick }: NodeProps) {
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      <mesh>
        <sphereGeometry args={[1.15, 48, 48]} />
        <meshStandardMaterial
          color="#16a34a"
          emissive="#22c55e"
          emissiveIntensity={0.65}
          roughness={0.15}
          metalness={0.2}
        />
      </mesh>

      {/* Cambia shape a "box" o "sphere" para alternar */}
      <CustomGeometryParticles count={2000} shape="sphere" color={color} />

      <Html position={[0, 2.2, 0]} center pointerEvents="none">
        <div className="rounded-md border border-green-500/70 bg-slate-900/80 px-3 py-1 text-xs font-semibold tracking-wide text-green-300">
          U-NET + SCHEDULER
        </div>
      </Html>
    </group>
  )
}