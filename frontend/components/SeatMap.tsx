'use client';

interface SeatMapProps {
  sections: any[];
  selected: string | null;
  onSelect: (seatId: string) => void;
}

function groupByRow(seats: any[]): [string, any[]][] {
  const rows: Record<string, any[]> = {};
  for (const s of seats) {
    const r = s.row || '?';
    if (!rows[r]) rows[r] = [];
    rows[r].push(s);
  }
  return Object.entries(rows).sort(([a], [b]) => a.localeCompare(b));
}

export default function SeatMap({ sections, selected, onSelect }: SeatMapProps) {
  if (!sections || sections.length === 0) {
    return <div className="py-10 text-center text-gray-500">No sections available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stage */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-pink-600/20 p-4 text-center">
        <span className="text-sm font-medium text-gray-300">🎤 STAGE</span>
      </div>

      {/* Sections */}
      {sections.map((section: any) => (
        <div key={section.sectionId} className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-semibold text-white">{section.sectionName}</span>
            <span className="text-sm font-medium text-blue-400">
              {(section.price || 0).toLocaleString()} VND
            </span>
          </div>
          <div className="space-y-2">
            {groupByRow(section.seats || []).map(([row, seats]: [string, any[]]) => (
              <div key={row} className="flex items-center gap-2">
                <span className="w-8 text-center text-xs text-gray-500">{row}</span>
                <div className="flex gap-1 flex-wrap">
                  {seats.map((seat: any) => (
                    <button
                      key={seat.id}
                      onClick={() => seat.status === 'AVAILABLE' && onSelect(seat.id)}
                      disabled={seat.status !== 'AVAILABLE'}
                      title={`${seat.row}${seat.number} — ${seat.status}`}
                      className={`seat ${seat.status} ${selected === seat.id ? 'selected' : ''}`}
                    >
                      {seat.number}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-emerald-500"></span> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-blue-500"></span> Selected
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-yellow-500/60"></span> Held
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-gray-600"></span> Sold
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
