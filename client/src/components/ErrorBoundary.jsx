import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center"
          style={{ color: 'var(--text-secondary, #a1a1aa)' }}>
          <AlertTriangle size={48} className="mb-4" style={{ color: 'var(--error, #ef4444)' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary, #e4e4e7)' }}>
            Something went wrong
          </h2>
          <p className="text-sm mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'var(--primary, #6366f1)',
              color: '#fff',
            }}
          >
            <RefreshCw size={14} />
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
