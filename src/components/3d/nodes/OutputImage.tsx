import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface OutputImageProps {
  position: [number, number, number]
  visible: boolean
  onClick?: () => void
  imageSrc?: string | null
  showLabel?: boolean
  isActive?: boolean
  pulseTick?: number
}

export default function OutputImage({ position, visible, onClick, imageSrc, showLabel = true, isActive = false, pulseTick = 0 }: OutputImageProps) {
  const meshRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const frameRef = useRef<THREE.MeshStandardMaterial>(null)
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

  const imageTexture = useMemo(() => {
    if (typeof document === 'undefined') return null

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const sky = ctx.createLinearGradient(0, 0, 0, 320)
    sky.addColorStop(0, '#60a5fa')
    sky.addColorStop(1, '#dbeafe')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, 512, 512)

    ctx.fillStyle = '#334155'
    ctx.beginPath()
    ctx.moveTo(0, 320)
    ctx.lineTo(90, 220)
    ctx.lineTo(170, 300)
    ctx.lineTo(260, 180)
    ctx.lineTo(380, 310)
    ctx.lineTo(512, 230)
    ctx.lineTo(512, 512)
    ctx.lineTo(0, 512)
    ctx.closePath()
    ctx.fill()

    const lake = ctx.createLinearGradient(0, 320, 0, 512)
    lake.addColorStop(0, '#0f172a')
    lake.addColorStop(1, '#1d4ed8')
    ctx.fillStyle = lake
    ctx.fillRect(0, 350, 512, 162)

    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillRect(100, 90, 150, 5)
    ctx.fillRect(280, 120, 110, 4)

    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 26px sans-serif'
    ctx.fillText('Stable Diffusion Render', 95, 470)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    return texture
  }, [])

  const [texture, setTexture] = useState<THREE.Texture | null>(imageTexture)

  useEffect(() => {
    let mounted = true
    if (!imageSrc) {
      setTexture(imageTexture ?? null)
      return () => { mounted = false }
    }

    const loader = new THREE.TextureLoader()
    loader.load(
      imageSrc,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        if (mounted) setTexture(tex)
      },
      undefined,
      (err) => {
        // fallback to canvas texture on error
        console.error('Error loading OutputImage texture:', err)
        if (mounted) setTexture(imageTexture ?? null)
      }
    )

    return () => { mounted = false }
  }, [imageSrc, imageTexture])

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
        <meshStandardMaterial
          ref={materialRef}
          color="#ffffff"
          map={texture ?? undefined}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2.6, 2.6, 0.1]} />
        <meshStandardMaterial ref={frameRef} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} transparent opacity={0} toneMapped={false} />
      </mesh>

      {showLabel && (
        <Html position={[0, 2.2, 0]} center style={{ transition: 'opacity 1s', opacity: visible ? 1 : 0, pointerEvents: 'none' }}>
          <div
            className="rounded-md border border-white/70 bg-slate-900/80 px-3 py-1 text-xs font-semibold tracking-wide text-white"
            style={{
              transform: labelPulse ? 'scale(1.18)' : 'scale(1)',
              transition: 'transform 180ms ease-out, box-shadow 180ms ease-out, text-shadow 180ms ease-out',
              boxShadow: labelPulse ? '0 0 24px rgba(255,255,255,0.65)' : 'none',
              textShadow: labelPulse ? '0 0 8px rgba(255,255,255,0.95)' : 'none'
            }}
          >
            OUTPUT IMAGE
          </div>
        </Html>
      )}
    </group>
  )
}