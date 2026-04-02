const LoadingSkeleton = ({ rows = 3, className = '', itemClassName = '' }) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className={`rounded-2xl border border-slate-200/70 bg-white p-4 ${itemClassName}`}
      />
    ))}
  </div>
)

export default LoadingSkeleton
