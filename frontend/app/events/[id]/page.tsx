'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEvent, getSeatMap, holdSeat, createPayment, confirmMockPayment, isLoggedIn } from '../../../lib/api';
import SeatMap from '../../../components/SeatMap';
import StatusBadge from '../../../components/StatusBadge';
import LoadingState from '../../../components/LoadingState';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [seatMap, setSeatMap] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('MOCK');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      getEvent(eventId).then(e => { if (e) setEvent(e); });
      getSeatMap(eventId).then(s => { if (s) setSeatMap(s); });
    }
  }, [eventId]);

  function handleSelectSeat(seatId: string) {
    setSelected(seatId);
    if (seatMap?.sections) {
      for (const section of seatMap.sections) {
        const seat = (section.seats || []).find((s: any) => s.id === seatId);
        if (seat) {
          setSelectedSeatInfo({ ...seat, sectionName: section.sectionName, price: section.price });
          break;
        }
      }
    }
  }

  async function handleHold() {
    if (!isLoggedIn()) { setMsg('Please login first'); setMsgType('error'); return; }
    if (!selected) { setMsg('Select a seat first'); setMsgType('error'); return; }
    setLoading(true); setMsg('');
    const res = await holdSeat(eventId, selected);
    if (res.ok) {
      const bid = res.data.data?.id || res.data.id;
      setBookingId(bid);
      setMsg('Seat held! Booking: ' + bid.slice(0, 8) + '...');
      setMsgType('success');
      setSelected(null);
      setSelectedSeatInfo(null);
      getSeatMap(eventId).then(s => { if (s) setSeatMap(s); });
    } else if (res.status === 409) {
      setMsg('This seat was just taken. Please choose another.');
      setMsgType('error');
      setSelected(null);
      setSelectedSeatInfo(null);
      getSeatMap(eventId).then(s => { if (s) setSeatMap(s); });
    } else {
      setMsg('Hold failed: ' + JSON.stringify(res.data));
      setMsgType('error');
    }
    setLoading(false);
  }

  async function handlePay() {
    if (!bookingId) return;
    setPaying(true); setMsg('');
    const res = await createPayment(bookingId, paymentMethod);
    if (res.ok) {
      const data = res.data.data || res.data;
      setPaymentId(data.id);
      if (data.paymentUrl) {
        setPaymentUrl(data.paymentUrl);
        setMsg('Redirecting to payment provider...');
        setMsgType('success');
      } else if (paymentMethod === 'MOCK') {
        setMsg('Mock payment created. Click to simulate success.');
        setMsgType('success');
      }
    } else {
      setMsg('Payment failed: ' + (res.data?.message || 'Unknown error'));
      setMsgType('error');
    }
    setPaying(false);
  }

  async function handleMockConfirm() {
    if (!paymentId) return;
    setPaying(true); setMsg('');
    const res = await confirmMockPayment(paymentId);
    if (res.ok) {
      setConfirmed(true);
      setMsg('Payment confirmed! Your ticket is being issued...');
      setMsgType('success');
    } else {
      setMsg('Confirmation failed: ' + (res.data?.message || 'Unknown error'));
      setMsgType('error');
    }
    setPaying(false);
  }

  if (!event) return <LoadingState message="Loading event..." />;

  return (
    <div>
      {/* Event Hero */}
      <section className="relative mb-10 pb-6 pt-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="container-main relative z-10">
          {event.coverImageUrl && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img src={event.coverImageUrl} alt={event.name} className="w-full h-64 object-cover" />
            </div>
          )}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <StatusBadge status={event.status} />
                {event.category && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
                    {event.category}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">{event.name}</h1>
              <p className="mt-2 text-gray-400">
                📍 {event.venue}
                {event.startTime && (
                  <> · 📅 {new Date(event.startTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</>
                )}
              </p>
              {event.description && <p className="mt-3 text-sm text-gray-500">{event.description}</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="container-main">
        {/* Messages */}
        {msg && (
          <div className={'mb-6 ' + (msgType === 'error' ? 'toast-error' : 'toast-success')}>
            {msg}
            {confirmed && (
              <button onClick={() => router.push('/tickets')} className="ml-4 text-blue-400 underline">
                Go to Tickets →
              </button>
            )}
          </div>
        )}

        {/* Confirmed state */}
        {confirmed ? (
          <div className="glass-card p-10 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
            <p className="text-gray-400 mb-6">Your ticket is being issued via Kafka. Check your tickets in a few seconds.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => router.push('/tickets')} className="btn-glow">
                View My Tickets →
              </button>
              <button onClick={() => router.push('/events')} className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-all">
                Browse More Events
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Seat Map */}
            <div className="lg:col-span-3">
              {!seatMap ? (
                <LoadingState message="Loading seat map..." />
              ) : (
                <SeatMap
                  sections={seatMap.sections || []}
                  selected={selected}
                  onSelect={handleSelectSeat}
                />
              )}
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24 glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Booking Summary</h3>

                {selectedSeatInfo ? (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Section</span>
                      <span className="text-white font-medium">{selectedSeatInfo.sectionName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Seat</span>
                      <span className="text-white font-medium">{selectedSeatInfo.row}{selectedSeatInfo.number}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Price</span>
                      <span className="text-blue-400 font-semibold">{(selectedSeatInfo.price || 0).toLocaleString()} VND</span>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <div className="flex justify-between">
                        <span className="text-white font-medium">Total</span>
                        <span className="text-lg font-bold text-blue-400">{(selectedSeatInfo.price || 0).toLocaleString()} VND</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-6">Select a seat from the map to begin</p>
                )}

                {bookingId ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
                      ✅ Seat held! Complete payment to confirm.
                    </div>

                    {!paymentId ? (
                      <>
                        {/* Payment Method Selector */}
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 font-medium">Payment Method</p>
                          {['MOCK', 'MOMO', 'VNPAY'].map(m => (
                            <button
                              key={m}
                              onClick={() => setPaymentMethod(m)}
                              className={'w-full rounded-lg border p-3 text-left text-sm transition-all ' +
                                (paymentMethod === m
                                  ? 'border-blue-500 bg-blue-500/10 text-white'
                                  : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10')}
                            >
                              {m === 'MOCK' && '🧪 Mock Payment (Demo)'}
                              {m === 'MOMO' && '📱 MoMo E-Wallet'}
                              {m === 'VNPAY' && '💳 VNPay Gateway'}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={handlePay}
                          disabled={paying}
                          className="btn-glow w-full !bg-gradient-to-r !from-emerald-600 !to-emerald-500 disabled:opacity-50"
                        >
                          {paying ? 'Processing...' : '💳 Pay Now'}
                        </button>
                      </>
                    ) : paymentUrl ? (
                      <a
                        href={paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-glow w-full !bg-gradient-to-r !from-blue-600 !to-violet-600 text-center no-underline block"
                      >
                        🔗 Go to Payment Provider
                      </a>
                    ) : paymentMethod === 'MOCK' ? (
                      <button
                        onClick={handleMockConfirm}
                        disabled={paying}
                        className="btn-glow w-full !bg-gradient-to-r !from-emerald-600 !to-emerald-500 disabled:opacity-50"
                      >
                        {paying ? 'Confirming...' : '🧪 Simulate Payment Success'}
                      </button>
                    ) : (
                      <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-400">
                        {paymentMethod} sandbox is not configured in this demo environment.
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleHold}
                    disabled={!selected || loading}
                    className="btn-glow w-full disabled:opacity-50"
                  >
                    {loading ? 'Holding...' : selected ? '🔒 Hold Selected Seat' : 'Pick a Seat First'}
                  </button>
                )}

                {/* Seat Legend */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Legend</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded bg-emerald-500"></span> Available
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded bg-blue-500"></span> Selected
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded bg-yellow-500/60"></span> Held
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded bg-gray-600"></span> Sold
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
