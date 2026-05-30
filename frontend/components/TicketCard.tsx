import StatusBadge from './StatusBadge';

interface TicketCardProps {
  id: string;
  status: string;
  checkInCode?: string;
  seatInfo?: string;
  seatId?: string;
  eventName?: string;
  onCheckIn?: (id: string) => void;
}

export default function TicketCard({ id, status, checkInCode, seatInfo, seatId, eventName, onCheckIn }: TicketCardProps) {
  return (
    <div className="ticket-card">
      <div className="relative z-10">
        {eventName && (
          <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">{eventName}</p>
        )}
        <h3 className="text-lg font-semibold text-white">🎫 Ticket</h3>
        <div className="my-4 font-mono text-3xl font-bold tracking-[0.3em] text-blue-400">
          {checkInCode || 'N/A'}
        </div>
        <p className="text-sm text-gray-400">{seatInfo || `Seat ${seatId?.slice(0, 8) || 'N/A'}`}</p>
        <div className="my-4">
          <StatusBadge status={status} />
        </div>
        {status === 'VALID' && onCheckIn && (
          <button onClick={() => onCheckIn(id)} className="btn-glow">
            ✅ Check In
          </button>
        )}
        {status === 'USED' && <p className="text-amber-400">✅ Already checked in</p>}
        {status === 'CANCELLED' && <p className="text-red-400">❌ Ticket cancelled</p>}
      </div>
    </div>
  );
}
