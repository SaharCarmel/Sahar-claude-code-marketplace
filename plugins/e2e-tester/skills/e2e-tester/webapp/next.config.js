/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Allow image uploads
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
};

module.exports = nextConfig;
