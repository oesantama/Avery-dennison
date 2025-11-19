/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  typescript: {
    // ⚠️ PELIGROSO: Ignora errores TypeScript en build de producción
    ignoreBuildErrors: true,
  },
  eslint: {
    // También ignora errores ESLint para acelerar build
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8000',
  },
};

module.exports = nextConfig;
