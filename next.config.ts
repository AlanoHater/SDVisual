import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    formats: ['image/avif', 'image/webp']
  },
  experimental: {
    optimizePackageImports: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing'
    ]
  }
}

export default nextConfig
