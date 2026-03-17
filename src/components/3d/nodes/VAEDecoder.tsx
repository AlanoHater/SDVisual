import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface VAEDecoderProps {
  position: [number, number, number]
  onClick?: () => void
  showLabel?: boolean
  isActive?: boolean
  pulseTick?: number
}

export default function VAEDecoder({ position, onClick, showLabel = true, isActive = false, pulseTick = 0 }: VAEDecoderProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [labelPulse, setLabelPulse] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setLabelPulse(false)
      return
    }

    setLabelPulse(true)
    const id = window.setTimeout(() => setLabelPulse(false), 260)
    return () => window.clearTimeout(id)
  }, [isActive, pulseTick])

  useFrame((_, delta) => {
  if (groupRef.current) {
    groupRef.current.rotation.x -= delta * 0.12
    groupRef.current.rotation.y -= delta * 0.18
    groupRef.current.rotation.z -= delta * 0.08
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
          <meshStandardMaterial color="#7c2d12" transparent opacity={0.8} />
        </mesh>
        {/* Estructura alámbrica exterior */}
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={2} wireframe toneMapped={false} />
        </mesh>
      </group>
      {showLabel && (
        <Html position={[0, 2.2, 0]} center pointerEvents="none">
          <div
            className="rounded-md border border-orange-500/70 bg-slate-900/80 px-3 py-1 text-xs font-semibold tracking-wide text-orange-300"
            style={{
              transform: labelPulse ? 'scale(1.18)' : 'scale(1)',
              transition: 'transform 180ms ease-out, box-shadow 180ms ease-out, text-shadow 180ms ease-out',
              boxShadow: labelPulse ? '0 0 24px rgba(249,115,22,0.65)' : 'none',
              textShadow: labelPulse ? '0 0 8px rgba(253,186,116,0.95)' : 'none'
            }}
          >
            VAE DECODER
          </div>
        </Html>
      )}
    </group>
  )
}