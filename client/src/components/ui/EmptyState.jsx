import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  message = '',
  actionLabel = '',
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Icon size={48} className="mb-4" style={{ color: 'var(--text-muted, #71717a)' }} />
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary, #e4e4e7)' }}>
        {title}
      </h3>
      {message && (
        <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--text-muted, #71717a)' }}>
          {message}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--primary, #6366f1)',
            color: '#fff',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
