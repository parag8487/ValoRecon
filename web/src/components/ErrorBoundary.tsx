import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an unhandled UI error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      this.setState({ hasError: false, error: null, errorInfo: null });
    } catch {}
    window.location.reload();
  };

  private handleGoHome = () => {
    try {
      this.setState({ hasError: false, error: null, errorInfo: null });
    } catch {}
    window.location.href = '/companion';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-primary)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 70, 85, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            color: 'var(--accent-red)'
          }}>
            <AlertTriangle size={32} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '0.04em' }}>
            {this.props.fallbackTitle || 'SCREEN RENDER ISSUE DETECTED'}
          </h2>

          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            maxWidth: '500px',
            margin: '0 0 24px 0',
            lineHeight: 1.6
          }}>
            An unexpected error occurred while rendering this interface. ValoRecon prevented the application from crashing.
          </p>

          {this.state.error && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '12px 16px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#ff9800',
              maxWidth: '600px',
              wordBreak: 'break-word',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--accent-red)',
                border: 'none',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} />
              Reload Screen
            </button>

            <button
              onClick={this.handleGoHome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Home size={15} />
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
