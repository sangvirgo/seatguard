import Link from 'next/link';

interface EventCardProps {
  id: string;
  name: string;
  venue: string;
  category?: string;
  status?: string;
  startTime?: string;
  image?: string;
}

const categoryIcons: Record<string, string> = {
  CONCERT: '🎵',
  WORKSHOP: '🎓',
  SPORTS: '⚽',
  THEATER: '🎭',
  DEFAULT: '🎪',
};

export default function EventCard({ id, name, venue, category, status, startTime }: EventCardProps) {
  const icon = categoryIcons[category?.toUpperCase() || ''] || categoryIcons.DEFAULT;
  const dateStr = startTime
    ? new Date(startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <Link href={`/events/${id}`} className="group no-underline">
      <div className="glass-card overflow-hidden">
        <div className="relative h-40 bg-gradient-to-br from-blue-600/20 via-violet-600/20 to-pink-600/20 flex items-center justify-center">
          <span className="text-6xl opacity-60 group-hover:opacity-80 transition-opacity">{icon}</span>
          {status && (
            <span className={`badge-status ${status} absolute top-3 right-3`}>
              {status}
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {name}
          </h3>
          <p className="text-sm text-gray-400">📍 {venue}</p>
          {dateStr && <p className="mt-2 text-xs text-gray-500">📅 {dateStr}</p>}
          {category && (
            <span className="mt-3 inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
              {category}
            </span>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
            View details →
          </div>
        </div>
      </div>
    </Link>
  );
}
