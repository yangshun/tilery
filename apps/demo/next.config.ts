import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tilery/core', '@tilery/react'],
};

export default nextConfig;
