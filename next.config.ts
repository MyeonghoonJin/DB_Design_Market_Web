import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', 'jsonwebtoken', 'mysql2'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img1.daumcdn.net',
      },
      {
        protocol: 'https',
        hostname: '**', // 모든 HTTPS 도메인 허용 (개발용)
      },
    ],
  },
};

export default nextConfig;
