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
  env: {
    API_BASE_URL: process.env.API_BASE_URL,
    API_KEY: process.env.API_KEY,
    ENVIRONMENT: process.env.ENVIRONMENT,
  },
}

export default nextConfig
