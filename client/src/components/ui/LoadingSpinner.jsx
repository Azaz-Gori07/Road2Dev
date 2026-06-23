import { Loader } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...', size = 24 }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3"
      style={{ color: 'var(--text-muted, #71717a)' }}>
      <Loader size={size} className="animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
