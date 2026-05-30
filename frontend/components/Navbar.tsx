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
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050510]/80 backdrop-blur-xl">
      <div className="container-main flex items-center justify-between py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-2xl">🛡️</span>
          <span className="text-lg font-bold text-white">
            Seat<span className="gradient-text">Guard</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/events" className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors">
            Events
          </Link>
          <Link href="/tickets" className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors">
            My Tickets
          </Link>
          <Link href="/proof" className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors">
            Proof
          </Link>
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
            <Link href="/login" className="btn-glow !py-2 !px-5 text-sm no-underline">
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
        <div className="md:hidden border-t border-white/5 bg-[#050510]/95 backdrop-blur-xl">
          <div className="container-main flex flex-col gap-4 py-6">
            <Link href="/events" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors">
              Events
            </Link>
            <Link href="/tickets" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors">
              My Tickets
            </Link>
            <Link href="/proof" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-400 hover:text-white no-underline transition-colors">
              Proof
            </Link>
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
              <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-glow !py-2 text-sm no-underline text-center">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
