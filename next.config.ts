import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit', '@neondatabase/serverless'],
  allowedDevOrigins: ['balipu.vercel.app'],
  async redirects() {
    return [
      {
        source: '/events/next-run',
        destination: '/events/balipu-x-aloysius',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
