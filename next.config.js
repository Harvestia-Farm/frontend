/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ignore TypeScript checking for Unity game files
  typescript: {
    ignoreBuildErrors: true
  },
  // Exclude Unity game files from webpack processing
  webpack: (config) => {
    config.module.rules.push({
      test: /public\/game\/.+\.(js|html|css)$/,
      type: 'asset/resource',
      parser: {
        javascript: {
          strictMode: false
        }
      }
    });
    return config;
  }
};

module.exports = nextConfig;
