const Pagination = ({ page, total, limit, onPageChange }) => {
  const totalPages = Math.ceil(total / limit)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <p className="text-sm text-[--color-text-muted] dark:text-slate-400">
        Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-[--color-bg] dark:bg-slate-900"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-[--color-bg] dark:bg-slate-900"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Pagination
