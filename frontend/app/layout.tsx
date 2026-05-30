import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SeatGuard — High-Concurrency Ticket Booking',
  description: 'Zero double-booking under 14,374 concurrent requests',
};

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-bold text-[var(--color-text)] no-underline">
          🛡️ <span className="text-[var(--color-accent)]">Seat</span>Guard
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/events" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] no-underline transition-colors">Events</Link>
          <Link href="/tickets" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] no-underline transition-colors">Tickets</Link>
          <Link href="/proof" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] no-underline transition-colors">Proof</Link>
          <Link href="/login" className="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white no-underline hover:bg-[var(--color-accent-hover)] transition-colors">Login</Link>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <Navbar />
        <main className="mx-auto max-w-6xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
