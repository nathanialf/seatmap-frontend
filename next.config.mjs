/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    'dev.internal.defnf.com',
    '*.defnf.com',
    'localhost',
    '127.0.0.1',
  ],
}

export default nextConfig
