/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    REGISTRY_API_URL: process.env.REGISTRY_API_URL || 'http://localhost:3000/api/v1',
  },
  images: {
    domains: ['localhost', 'registry.openstandardagents.org'],
  },
};

export default nextConfig;
