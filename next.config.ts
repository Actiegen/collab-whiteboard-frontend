import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.run.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['@tldraw/tldraw', '@tldraw/sync'],
  webpack: (config) => {
    // Resolve tldraw multiple instances issue
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tldraw/tldraw': require.resolve('@tldraw/tldraw'),
      '@tldraw/sync': require.resolve('@tldraw/sync'),
    };

    return config;
  },
};

export default nextConfig;
