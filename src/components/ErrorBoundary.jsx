import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { reportError, ERROR_TYPES, ERROR_SEVERITY } from '../utils/errorHandler'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Report the error
    const errorReport = reportError(error, {
      errorInfo,
      errorId,
      component: this.props.componentName || 'Unknown',
      severity: ERROR_SEVERITY.CRITICAL,
      type: ERROR_TYPES.UNKNOWN
    })

    this.setState({
      error,
      errorInfo,
      errorId,
      errorReport
    })

    console.error('Error Boundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-surface rounded-lg shadow-card p-6 text-center">
              <div className="mb-6">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-text mb-2">
                  Something went wrong
                </h1>
                <p className="text-text/70 mb-4">
                  We're sorry, but something unexpected happened. The error has been reported and we're working to fix it.
                </p>
                
                {this.state.errorId && (
                  <div className="bg-primary/5 border border-primary/10 rounded-md p-3 mb-4">
                    <p className="text-sm text-text/80">
                      Error ID: <code className="font-mono text-primary">{this.state.errorId}</code>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Go Home</span>
                </button>
              </div>

              {/* Development mode: Show error details */}
              {import.meta.env.VITE_APP_ENVIRONMENT === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-text/70 hover:text-text">
                    Error Details (Development)
                  </summary>
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    <div className="mb-2">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component to wrap components with error boundary
export const withErrorBoundary = (Component, componentName) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary componentName={componentName}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for handling errors in functional components
export const useErrorHandler = () => {
  const handleError = (error, context = {}) => {
    const appError = reportError(error, context)
    
    // In a real app, you might want to show a toast notification
    // or update some global error state here
    console.error('Handled error:', appError)
    
    return appError
  }

  return { handleError }
}

export default ErrorBoundary
