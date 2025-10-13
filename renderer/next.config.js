/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  webpack: (config) => {
    // customize webpack if needed, then return config
    return config;
  },
};