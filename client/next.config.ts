import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    serverExternalPackages: ["mongoose", "bcryptjs", "jsonwebtoken"],
    // @ts-ignore - added to support cross origin dev server
    allowedDevOrigins: ['192.168.56.1', 'localhost', '127.0.0.1'],
    async rewrites() {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/:path*`,
            },
        ];
    },
};

export default nextConfig;
