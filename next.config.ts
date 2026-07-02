import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin', 'jwks-rsa', 'jose'],
  allowedDevOrigins: ['balipu.vercel.app'],
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://balipu.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
