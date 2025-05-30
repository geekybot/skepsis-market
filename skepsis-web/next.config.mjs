/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Exclude the examples folder from being processed
  webpack: (config) => {
    // Simple way to exclude the examples directory
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/examples/**']
    };
    return config;
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
