import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SeatGuard — High-Concurrency Ticket Booking',
  description: 'Production-grade ticket booking platform with zero double-booking under 14,374 concurrent requests',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="navbar">
          <a href="/" className="logo">🛡️ <span>Seat</span>Guard</a>
          <nav>
            <a href="/events">Events</a>
            <a href="/tickets">Tickets</a>
            <a href="/proof">Proof</a>
            <a href="/login">Login</a>
          </nav>
        </header>
        <main className="container" style={{ padding: '32px 20px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
