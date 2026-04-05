const LoadingSpinner = () => (
  <div className="animate-pulse space-y-4 py-4">
    <div className="h-6 w-40 rounded-full bg-slate-200/80" />
    <div className="space-y-3">
      <div className="h-24 rounded-3xl border border-slate-200/80 bg-[--color-bg-card] dark:bg-slate-800" />
      <div className="h-24 rounded-3xl border border-slate-200/80 bg-[--color-bg-card] dark:bg-slate-800" />
      <div className="h-24 rounded-3xl border border-slate-200/80 bg-[--color-bg-card] dark:bg-slate-800" />
    </div>
  </div>
)

export default LoadingSpinner
