import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text, Html } from '@react-three/drei'
import * as THREE from 'three'

const PROMPT_WORDS = [
  "montañas", "valle", "río", "laguna", "bosque",
  "pradera", "niebla", "amanecer", "atardecer", "nubes",
  "sendero", "picos", "reflejo", "bruma", "cascada","realista","colorido"
]

function Word({ position, text }: { position: THREE.Vector3, text: string }) {
  const color = useMemo(() => new THREE.Color(), [])
  const ref = useRef<any>(null)
  const [hovered, setHovered] = useState(false)

  const over = (e: any) => { 
    e.stopPropagation()
    setHovered(true) 
  }
  const out = () => setHovered(false)

  useEffect(() => {
    if (hovered) document.body.style.cursor = 'pointer'
    return () => { document.body.style.cursor = 'auto' }
  }, [hovered])

  useFrame(() => {
    if (ref.current) {
      ref.current.material.color.lerp(color.set(hovered ? '#3b82f6' : '#d1d5db'), 0.1)
    }
  })

  return (
    <Billboard position={position}>
      <Text 
        ref={ref} 
        onPointerOver={over} 
        onPointerOut={out} 
        fontSize={0.22} 
        letterSpacing={-0.03} 
        lineHeight={1} 
        material-toneMapped={false}
      >
        {text}
      </Text>
    </Billboard>
  )
}

function Cloud({ count = 3, radius = 1.2 }) {
  const words = useMemo(() => {
    const temp: [THREE.Vector3, string][] = []
    const spherical = new THREE.Spherical()
    const phiSpan = Math.PI / (count + 1)
    const thetaSpan = (Math.PI * 2) / count

    for (let i = 1; i < count + 1; i++) {
      for (let j = 0; j < count; j++) {
        const word = PROMPT_WORDS[Math.floor(Math.random() * PROMPT_WORDS.length)]
        temp.push([
          new THREE.Vector3().setFromSpherical(spherical.set(radius, phiSpan * i, thetaSpan * j)),
          word
        ])
      }
    }
    return temp
  }, [count, radius])

  return (
    <>
      {words.map(([pos, word], index) => (
        <Word key={index} position={pos} text={word} />
      ))}
    </>
  )
}

interface InputPromptProps {
  position: [number, number, number]
  onClick?: () => void
  showLabel?: boolean
  isActive?: boolean
  pulseTick?: number
}

export default function InputPrompt({ position, onClick, showLabel = true, isActive = false, pulseTick = 0 }: InputPromptProps) {
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
      groupRef.current.rotation.y += delta * 0.04
      groupRef.current.rotation.x += delta * 0.02
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
      <group ref={groupRef} scale={[0.85, 0.85, 0.85]}>
        <Cloud count={3} radius={1.2} />
      </group>

      {showLabel && (
        <Html position={[0, 2.2, 0]} center pointerEvents="none">
          <div
            className="rounded-md border border-slate-500/70 bg-slate-900/80 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200"
            style={{
              transform: labelPulse ? 'scale(1.18)' : 'scale(1)',
              transition: 'transform 180ms ease-out, box-shadow 180ms ease-out, text-shadow 180ms ease-out',
              boxShadow: labelPulse ? '0 0 24px rgba(148,163,184,0.65)' : 'none',
              textShadow: labelPulse ? '0 0 8px rgba(226,232,240,0.9)' : 'none'
            }}
          >
            INPUT PROMPT
          </div>
        </Html>
      )}
    </group>
  )
}