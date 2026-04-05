import { Component } from 'react'
import logger from '../utils/logger'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Unhandled UI error', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[--color-bg] dark:bg-slate-800 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[--color-bg-card] dark:bg-slate-800 rounded-2xl shadow-md dark:shadow-slate-900/50 p-8 text-center">
            <h1 className="text-2xl font-bold text-[--color-text] dark:text-slate-100">Something went wrong</h1>
            <p className="text-sm text-[--color-text-muted] dark:text-slate-400 mt-3">
              The app hit an unexpected error. Reload and try again.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 bg-primary text-white px-5 py-2 rounded-lg font-medium hover:bg-primary transition"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
