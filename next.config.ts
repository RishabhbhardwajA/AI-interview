import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    serverExternalPackages: ["mongoose", "bcryptjs", "jsonwebtoken"],
    // @ts-ignore - added to support cross origin dev server
    allowedDevOrigins: ['192.168.56.1', 'localhost', '127.0.0.1'],
};

export default nextConfig;
