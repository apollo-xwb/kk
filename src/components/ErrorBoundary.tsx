import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State;
  public override props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Krispy King App:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-black border-2 border-chicken-red rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-chicken-red/10 border-2 border-chicken-red rounded-full flex items-center justify-center mx-auto text-chicken-red animate-pulse">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                Something Went Wrong
              </h2>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                An unexpected system exception occurred. Don't worry, your cart and passes are safe in local storage.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-left text-[11px] font-mono text-red-400 max-h-28 overflow-y-auto break-all">
                {this.state.error.message || 'Unknown Error'}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-gold hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition border border-zinc-800 cursor-pointer"
              >
                <Home className="w-4 h-4 text-gold" />
                <span>Return To Main Menu</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
