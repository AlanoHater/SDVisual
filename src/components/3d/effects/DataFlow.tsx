import { Line } from '@react-three/drei'

export default function DataFlow() {
  return (
    <group>
      {/* Conexión TextEncoder -> UNet */}
      <Line 
        points={[[-5, 0, 0], [0, 0, 0]]} 
        color="#3b82f6" 
        lineWidth={2} 
        dashed dashScale={10} dashSize={1} dashOffset={0} 
      />
      {/* Conexión UNet -> VAE */}
      <Line 
        points={[[0, 0, 0], [5, 0, 0]]} 
        color="#22c55e" 
        lineWidth={2} 
        dashed dashScale={10} dashSize={1} dashOffset={0} 
      />
    </group>
  )
}