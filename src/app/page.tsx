import Scene from '../components/3d/Scene'

export default function Home() {
  return (
    <main
      className="w-full h-screen bg-gray-950 overflow-hidden"
      style={{ width: '100%', height: '100dvh', background: '#030712', overflow: 'hidden' }}
    >
      <Scene />
    </main>
  )
}