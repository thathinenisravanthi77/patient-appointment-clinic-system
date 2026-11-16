interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <span className="text-red-600 font-bold">!</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">Something went wrong</h3>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-xl border border-teal-600 text-teal-600 text-sm font-medium hover:bg-teal-50 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
