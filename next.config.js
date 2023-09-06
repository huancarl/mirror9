/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack(config) {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
};
module.exports = {
  images: {
    domains: ['latex.codecogs.com'],
  },
};


export default nextConfig;
