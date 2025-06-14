import React from 'react';

interface ChatErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ChatErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export class ChatErrorBoundary extends React.Component<
  ChatErrorBoundaryProps,
  ChatErrorBoundaryState
> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChatErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return (
        <Fallback 
          error={this.state.error} 
          reset={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; reset: () => void }> = ({ 
  error, 
  reset 
}) => (
  <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-red-800 text-lg font-semibold mb-2">
      Chat Error
    </div>
    <div className="text-red-600 text-sm mb-4 text-center">
      {error?.message || 'Something went wrong with the chat system.'}
    </div>
    <button
      onClick={reset}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);
