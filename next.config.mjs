/** @type {import('next').NextConfig} */
const nextConfig = {
  // Spine player requires transpilation for Next.js bundler
  transpilePackages: ['@esotericsoftware/spine-player'],
}

export default nextConfig
