import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin', 'jwks-rsa', 'jose', 'pdfkit'],
  allowedDevOrigins: ['balipu.vercel.app', 'b865-103-178-182-178.ngrok-free.app'],
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
