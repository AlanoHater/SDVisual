import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

interface FlowPathProps {
  points: [number, number, number][]
  color: string
  count?: number
  speedMin?: number
  speedMax?: number
}

function FlowPath({
  points,
  color,
  count = 80,
  speedMin = 0.22,
  speedMax = 0.55
}: FlowPathProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points]
  )

  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      offset: Math.random(),
      speed: speedMin + Math.random() * (speedMax - speedMin)
    }))
  }, [count, speedMax, speedMin])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const sampledPoints = useMemo(() => curve.getPoints(80), [curve])

  useFrame((_, delta) => {
    if (!meshRef.current) return

    particles.forEach((particle, i) => {
      particle.offset += delta * particle.speed
      if (particle.offset > 1) particle.offset = 0

      const position = curve.getPoint(particle.offset)
      dummy.position.copy(position)
      dummy.scale.setScalar(0.85 + Math.sin(particle.offset * Math.PI * 10) * 0.25)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <Line points={sampledPoints} color={color} transparent opacity={0.23} lineWidth={1.2} />
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

export default function DataFlow() {
  return (
    <group>
      {/* Prompt tokens -> Text Encoder */}
      <FlowPath
        points={[
          [-10.2, 1.1, 0.9],
          [-8.7, 1.5, 0.2],
          [-7.0, 1.1, 0]
        ]}
        color="#e2e8f0"
        count={56}
      />

      {/* Text embeddings -> U-Net conditioning */}
      <FlowPath
        points={[
          [-5.1, 1.1, 0],
          [-3.2, 1.9, 0.8],
          [-1.7, 1.15, 0]
        ]}
        color="#60a5fa"
        count={76}
      />

      {/* Noise schedule loop around U-Net (iterative denoising steps) */}
      <FlowPath
        points={[
          [1.4, 1.1, 0],
          [0.8, 2.8, 1.8],
          [0, 3.2, 0],
          [-0.8, 2.8, -1.8],
          [-1.4, 1.1, 0],
          [0, 0.4, 1.6],
          [1.4, 1.1, 0]
        ]}
        color="#22d3ee"
        count={120}
        speedMin={0.35}
        speedMax={0.72}
      />

      {/* Denoised latent -> VAE decoder */}
      <FlowPath
        points={[
          [1.7, 1.1, 0],
          [3.8, 1.7, -0.7],
          [5.1, 1.05, 0]
        ]}
        color="#22c55e"
        count={84}
      />

      {/* Decoded pixels -> output image */}
      <FlowPath
        points={[
          [7.0, 1.1, 0],
          [8.8, 1.45, 0.5],
          [10.0, 1.1, 0]
        ]}
        color="#fb923c"
        count={64}
      />
    </group>
  )
}