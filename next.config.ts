import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', 'jsonwebtoken', 'mysql2'],
};

export default nextConfig;
