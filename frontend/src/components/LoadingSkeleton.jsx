const LoadingSkeleton = ({ rows = 3, className = '', itemClassName = '' }) => (
  <div className={`space-y-3 ${className}`} role="status" aria-live="polite" aria-label="Loading content">
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className={`ui-skeleton-card rounded-2xl p-4 ${itemClassName}`}
      >
        <div className="flex h-full min-h-12 gap-4">
          <div className="ui-skeleton-line h-10 w-10 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col justify-center space-y-3">
            <div className="ui-skeleton-line h-4 w-2/5 rounded-full" />
            <div className="ui-skeleton-line h-3 w-4/5 rounded-full" />
            <div className="flex gap-2">
              <div className="ui-skeleton-line h-3 w-20 rounded-full" />
              <div className="ui-skeleton-line h-3 w-14 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    ))}
    <span className="sr-only">Loading content...</span>
  </div>
)

export default LoadingSkeleton
