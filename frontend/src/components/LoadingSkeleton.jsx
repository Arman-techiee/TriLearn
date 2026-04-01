const LoadingSkeleton = ({ rows = 3, className = '', itemClassName = '' }) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className={`h-20 rounded-2xl bg-gray-200/80 ${itemClassName}`}
      />
    ))}
  </div>
)

export default LoadingSkeleton
