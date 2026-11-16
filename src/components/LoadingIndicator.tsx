export function LoadingIndicator({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-[spin_1s_linear_infinite]" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  );
}
