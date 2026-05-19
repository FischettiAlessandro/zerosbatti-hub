import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.zerosbattisocial.it',
        pathname: '/wp-content/**',
      },
    ],
  },
  turbopack: {},
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
