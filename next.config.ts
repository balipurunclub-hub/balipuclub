import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit', '@neondatabase/serverless'],
  allowedDevOrigins: ['balipu.vercel.app', 'balipuclub.in', 'www.balipuclub.in'],
  async redirects() {
    return [
      {
        source: '/about',
        destination: '/',
        permanent: true,
      },
      {
        source: '/events/next-run',
        destination: '/events/balipu-x-aloysius',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/events/balipu-x-aloysius/register',
        permanent: false,
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
