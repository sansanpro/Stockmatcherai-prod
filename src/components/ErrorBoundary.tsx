import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-cream">
          <span className="text-6xl mb-6">😬</span>
          <h2 className="text-2xl font-bold text-ink mb-2">Something went wrong</h2>
          <p className="text-ink-soft mb-8 max-w-sm">
            Don't worry — your matches are safe. Try refreshing the page.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-clay-ink text-primary-foreground rounded-xl px-8"
          >
            Refresh App
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
