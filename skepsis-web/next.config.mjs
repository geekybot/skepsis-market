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
};

export default nextConfig;
