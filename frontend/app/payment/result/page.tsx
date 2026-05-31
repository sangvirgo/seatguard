'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPayment } from '../../../lib/api';

function PaymentResultInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string>('checking');
  const [msg, setMsg] = useState('Verifying payment...');

  useEffect(() => {
    const paymentId = searchParams.get('paymentId') || searchParams.get('vnp_TxnRef');
    if (paymentId) {
      getPayment(paymentId)
        .then(res => {
          if (res.ok) {
            const data = res.data.data || res.data;
            if (data.status === 'SUCCESS') {
              setStatus('success');
              setMsg('Payment successful! Your ticket is being issued...');
            } else if (data.status === 'PENDING') {
              setStatus('pending');
              setMsg('Payment is being processed. Please wait...');
            } else {
              setStatus('failed');
              setMsg('Payment ' + (data.status || 'unknown') + '. Please try again.');
            }
          } else {
            setStatus('failed');
            setMsg('Could not verify payment status.');
          }
        })
        .catch(() => {
          setStatus('failed');
          setMsg('Network error verifying payment.');
        });
    } else {
      // No payment ID — check for success param from mock flow
      const success = searchParams.get('success');
      if (success === 'true') {
        setStatus('success');
        setMsg('Payment confirmed!');
      } else {
        setStatus('failed');
        setMsg('No payment information found.');
      }
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="glass-card p-8">
          {status === 'checking' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-3xl animate-pulse">⏳</div>
              <h2 className="text-xl font-bold text-white">Verifying Payment...</h2>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-green-600 text-3xl">✅</div>
              <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
              <p className="mt-2 text-sm text-gray-400">{msg}</p>
              <div className="mt-6 flex justify-center gap-3">
                <button onClick={() => router.push('/tickets')} className="btn-glow">View Tickets →</button>
                <button onClick={() => router.push('/events')} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">Browse Events</button>
              </div>
            </>
          )}
          {status === 'pending' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-600 to-orange-600 text-3xl">⏳</div>
              <h2 className="text-xl font-bold text-white">Payment Pending</h2>
              <p className="mt-2 text-sm text-gray-400">{msg}</p>
            </>
          )}
          {status === 'failed' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-pink-600 text-3xl">❌</div>
              <h2 className="text-xl font-bold text-white">Payment Failed</h2>
              <p className="mt-2 text-sm text-gray-400">{msg}</p>
              <div className="mt-6 flex justify-center gap-3">
                <button onClick={() => router.push('/events')} className="btn-glow">Try Again</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="text-3xl animate-pulse">⏳</div>
          <h2 className="mt-4 text-xl font-bold text-white">Loading...</h2>
        </div>
      </div>
    }>
      <PaymentResultInner />
    </Suspense>
  );
}
