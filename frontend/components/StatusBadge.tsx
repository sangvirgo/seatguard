interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    VALID: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    USED: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
    PUBLISHED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    DRAFT: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    PENDING_PAYMENT: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    CONFIRMED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  };

  const colorClass = colors[status] || 'bg-gray-500/15 text-gray-400 border-gray-500/20';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${colorClass}`}>
      {status === 'VALID' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>}
      {status === 'USED' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>}
      {status === 'CANCELLED' && <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>}
      {status}
    </span>
  );
}
