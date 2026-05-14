const LoadingSpinner = () => (
  <div className="space-y-4 py-4" role="status" aria-live="polite" aria-label="Loading content">
    <div className="ui-skeleton-line h-6 w-40 rounded-full" />
    <div className="space-y-3">
      <div className="ui-skeleton-card h-24 rounded-3xl" />
      <div className="ui-skeleton-card h-24 rounded-3xl" />
      <div className="ui-skeleton-card h-24 rounded-3xl" />
    </div>
    <span className="sr-only">Loading content...</span>
  </div>
)

export default LoadingSpinner
