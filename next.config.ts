import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Port is configured in package.json scripts (dev/start commands)
  // No need for runtime config in Next.js 16
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fpzeddlznbojykftyjyc.supabase.co', // Current project domain
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // For Google profile images
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // For GitHub avatars
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com', // For Discord avatars
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;