import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
                <RefreshCw className="w-10 h-10 text-red-600 animate-spin-slow" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-black uppercase tracking-tighter">Something went wrong</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                We encountered an unexpected error. Please try refreshing the page or return to home.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-900 transition-all"
              >
                Refresh Page
              </button>
              <a 
                href="/"
                className="flex-1 bg-gray-50 text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </a>
            </div>
            <div className="mt-8 p-4 bg-gray-50 rounded-xl text-left overflow-auto max-h-40">
              <p className="text-[10px] font-mono text-red-600">{this.state.error?.toString()}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
