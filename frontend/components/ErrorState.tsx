interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="glass-card border-red-500/20 py-20 text-center">
      <div className="mb-4 text-5xl">⚠️</div>
      <p className="mb-2 text-lg font-medium text-white">{title}</p>
      <p className="mb-6 text-gray-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-glow">
          Try Again
        </button>
      )}
    </div>
  );
}
