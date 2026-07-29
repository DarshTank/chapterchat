import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '100mb',
        },
    },
    turbopack: {
        resolveAlias: {
            fs: './lib/empty-module.js',
            path: './lib/empty-module.js',
            crypto: './lib/empty-module.js',
        },
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        localPatterns: [
            {
                pathname: '/**',
            },
        ],
        remotePatterns: [
            { protocol: 'https', hostname: 'covers.openlibrary.org' },
            { protocol: 'https', hostname: '*.blob.vercel-storage.com' },
            { protocol: 'https', hostname: '*.private.blob.vercel-storage.com' },
            { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: '*.googleusercontent.com' },
        ]
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
            };
        }
        return config;
    },
};

export default nextConfig;
