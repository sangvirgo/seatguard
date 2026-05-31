'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isLoggedIn, getProfile, logout } from '../lib/api';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      getProfile().then(u => { if (u) setUser(u); });
    }
  }, []);

  function handleLogout() {
    logout();
    setUser(null);
    window.location.href = '/';
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline group">
          <span className="text-2xl drop-shadow-[0_0_8px_rgba(99,102,241,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(99,102,241,0.6)] transition-all">🛡️</span>
          <span className="text-lg font-bold text-white">
            Seat<span className="gradient-text">Guard</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/events" className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors px-1.5 py-0.5">
            Events
          </Link>
          <Link href="/tickets" className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors px-1.5 py-0.5">
            My Tickets
          </Link>
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors px-1.5 py-0.5">
              Admin
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{user.fullName || user.email}</span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-gray-400 hover:bg-white/5 transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-block bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl px-5 py-2 text-sm font-semibold no-underline hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-6 bg-gray-300 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-6 bg-gray-300 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-gray-300 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-4 py-6">
            <Link href="/events" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors">
              Events
            </Link>
            <Link href="/tickets" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors">
              My Tickets
            </Link>
            {user?.role === 'ADMIN' && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors">
                Admin
              </Link>
            )}
            {user ? (
              <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                <span className="text-sm text-gray-400">{user.fullName || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 transition-all text-left"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="inline-block bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl px-5 py-2 text-sm font-semibold no-underline text-center"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
