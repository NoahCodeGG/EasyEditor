import { Component, type PropsWithChildren } from 'react'

interface ErrorBoundaryProps extends PropsWithChildren {
  fallback?: React.ReactNode | ((props: { error: Error }) => React.ReactNode)
  catchError?: (error: Error) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  __ref: any

  static defaultProps: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  componentDidCatch(error: Error) {
    this.state.hasError = true
    this.state.error = error
  }

  renderFallback() {
    const { fallback } = this.props
    if (typeof fallback === 'function') {
      return fallback({ error: this.state.error! })
    }
    return fallback
  }

  render() {
    if (this.state.hasError) {
      if (this.props.catchError) {
        this.props.catchError(this.state.error!)
      }

      if (this.props.fallback) {
        return this.renderFallback()
      }
    }

    return this.props.children
  }
}
