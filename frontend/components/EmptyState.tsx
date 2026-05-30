import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({ icon = '🎪', title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="glass-card py-20 text-center">
      <div className="mb-4 text-5xl">{icon}</div>
      <p className="mb-2 text-lg font-medium text-white">{title}</p>
      {description && <p className="mb-6 text-gray-400">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-glow no-underline">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
