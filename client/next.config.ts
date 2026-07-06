import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    serverExternalPackages: ["mongoose", "bcryptjs", "jsonwebtoken"],
    // @ts-ignore - added to support cross origin dev server
    allowedDevOrigins: ['192.168.56.1', 'localhost', '127.0.0.1'],
    async rewrites() {
        let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-interview-09xc.onrender.com/api';
        if (!backendUrl.endsWith('/api')) {
            backendUrl = backendUrl.replace(/\/$/, '') + '/api';
        }
        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/:path*`,
            },
        ];
    },
};

export default nextConfig;
