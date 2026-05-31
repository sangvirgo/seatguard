'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (token && refreshToken) {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Fetch profile to get userId
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(profile => {
          if (profile?.id) {
            localStorage.setItem('userId', profile.id);
          }
          router.replace('/');
        })
        .catch(() => {
          router.replace('/');
        });
    } else {
      // No tokens — redirect to login with error
      router.replace('/login?error=oauth_no_token');
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="glass-card p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-3xl animate-pulse">
            🔐
          </div>
          <h2 className="text-xl font-bold text-white">Signing you in...</h2>
          <p className="mt-2 text-sm text-gray-400">Completing Google authentication</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="glass-card p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-3xl animate-pulse">
              ⏳
            </div>
            <h2 className="text-xl font-bold text-white">Loading...</h2>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
