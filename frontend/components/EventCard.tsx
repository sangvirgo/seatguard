import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';

interface EventCardProps {
  id: string;
  name: string;
  venue: string;
  category?: string;
  status?: string;
  startTime?: string;
  coverImageUrl?: string;
}

const categoryGradients: Record<string, string> = {
  CONCERT: 'from-purple-600/30 via-pink-600/20 to-blue-600/30',
  WORKSHOP: 'from-emerald-600/30 via-teal-600/20 to-cyan-600/30',
  SPORTS: 'from-orange-600/30 via-red-600/20 to-yellow-600/30',
  THEATER: 'from-rose-600/30 via-pink-600/20 to-violet-600/30',
  DEFAULT: 'from-blue-600/30 via-violet-600/20 to-pink-600/30',
};

const categoryIcons: Record<string, string> = {
  CONCERT: '🎵',
  WORKSHOP: '🎓',
  SPORTS: '⚽',
  THEATER: '🎭',
  DEFAULT: '🎪',
};

export default function EventCard({ id, name, venue, category, status, startTime, coverImageUrl }: EventCardProps) {
  const icon = categoryIcons[category?.toUpperCase() || ''] || categoryIcons.DEFAULT;
  const gradient = categoryGradients[category?.toUpperCase() || ''] || categoryGradients.DEFAULT;
  const dateStr = startTime
    ? new Date(startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const timeStr = startTime
    ? new Date(startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <Link href={`/events/${id}`} className="group no-underline w-full">
      <div className="glass-card overflow-hidden hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)]">
        <div className={`relative h-40 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          {coverImageUrl ? (
            <>
              <img
                src={coverImageUrl}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </>
          ) : (
            <span className="text-6xl opacity-60 group-hover:opacity-80 transition-opacity">{icon}</span>
          )}
          {status && (
            <span className={`badge-status ${status} absolute top-3 right-3`}>
              {status}
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
            {name}
          </h3>
          <p className="text-sm text-gray-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{venue}</span>
          </p>
          {dateStr && (
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              {dateStr}{timeStr ? ` at ${timeStr}` : ''}
            </p>
          )}
          {category && (
            <span className="mt-3 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
              {category}
            </span>
          )}
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
              View Seats <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
