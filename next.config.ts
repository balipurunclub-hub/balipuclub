import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin', 'jwks-rsa', 'jose'],
  allowedDevOrigins: ['1a0b-103-178-182-178.ngrok-free.app'],
};

export default nextConfig;
