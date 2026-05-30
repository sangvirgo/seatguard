import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'SeatGuard — Premium Ticket Booking',
  description: 'Book your next live experience with confidence. Secure seat booking under high demand.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="flex min-h-screen flex-col bg-gradient-hero text-gray-200 antialiased">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-white/5 py-8">
          <div className="container-main flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <span className="text-sm font-bold text-white">Seat<span className="gradient-text">Guard</span></span>
            </div>
            <p className="text-xs text-gray-500">
              Built with Spring Boot · Redis · Kafka · PostgreSQL · Next.js
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
