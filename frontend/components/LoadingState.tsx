export default function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="py-20 text-center text-gray-500">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-blue-500"></div>
      {message}
    </div>
  );
}
