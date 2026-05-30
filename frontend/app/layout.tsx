import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SeatGuard — Premium Ticket Booking',
  description: 'One seat. Thousands of buyers. Zero double-booking.',
};

function Navbar() {
  return (
    <header className="navbar sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-2xl">🛡️</span>
          <span className="text-lg font-bold text-white">Seat<span className="gradient-text">Guard</span></span>
        </Link>
        <nav className="flex items-center gap-8">
          <Link href="/events" className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors">Events</Link>
          <Link href="/tickets" className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors">Tickets</Link>
          <Link href="/proof" className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors">Proof</Link>
          <Link href="/login" className="btn-glow !py-2 !px-5 text-sm no-underline">Login</Link>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-hero text-gray-200 antialiased">
        <Navbar />
        <main className="mx-auto max-w-6xl px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
