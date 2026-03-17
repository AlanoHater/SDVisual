import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text, Html } from '@react-three/drei'
import * as THREE from 'three'

const PROMPT_WORDS = [
  "montañas", "valle", "río", "laguna", "bosque",
  "pradera", "niebla", "amanecer", "atardecer", "nubes",
  "sendero", "picos", "reflejo", "bruma", "cascada"
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

export default function InputPrompt({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1
      groupRef.current.rotation.x += delta * 0.05
    }
  })

  return (
    <group position={position}>
      <group ref={groupRef} scale={[0.85, 0.85, 0.85]}>
        <Cloud count={3} radius={1.2} />
      </group>

      <Html position={[0, -2.2, 0]} center>
        <div className="w-44 p-3 rounded-lg bg-gray-900/80 border border-gray-500 backdrop-blur-sm text-white text-xs">
          <h3 className="font-bold text-gray-300 mb-1">INPUT PROMPT</h3>
          <p className="text-gray-400 text-[10px]">Nube de palabras: paisaje, clima y elementos naturales.</p>
        </div>
      </Html>
    </group>
  )
}