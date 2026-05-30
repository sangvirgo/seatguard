/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Allow API calls to backend services from server-side
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: 'http://auth-service:8081/api/auth/:path*' },
      { source: '/api/events/:path*', destination: 'http://event-service:8082/api/events/:path*' },
      { source: '/api/bookings/:path*', destination: 'http://booking-service:8083/api/bookings/:path*' },
      { source: '/api/tickets/:path*', destination: 'http://ticket-service:8084/api/tickets/:path*' },
    ];
  },
};

module.exports = nextConfig;
