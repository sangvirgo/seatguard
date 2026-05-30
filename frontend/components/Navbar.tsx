'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isLoggedIn, getProfile, logout } from '../lib/api';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

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
    <header className="navbar sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-2xl">🛡️</span>
          <span className="text-lg font-bold text-white">
            Seat<span className="gradient-text">Guard</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6">
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
      </div>
    </header>
  );
}
