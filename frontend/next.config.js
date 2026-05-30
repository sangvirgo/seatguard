/** @type {import('next').NextConfig} */
const gatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:8080';

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${gatewayUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
