import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorDisplay({
  message = 'Something went wrong',
  detail = '',
  onRetry,
  retryLabel = 'Try Again',
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertTriangle size={48} className="mb-4" style={{ color: 'var(--error, #ef4444)' }} />
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary, #e4e4e7)' }}>
        {message}
      </h3>
      {detail && (
        <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--text-muted, #71717a)' }}>
          {detail}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--primary, #6366f1)',
            color: '#fff',
          }}
        >
          <RefreshCw size={14} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
