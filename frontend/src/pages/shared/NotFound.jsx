import { Link } from 'react-router-dom'

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center px-4 py-10">
    <div className="ui-card w-full max-w-xl rounded-[2rem] p-8 text-center md:p-10">
      <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-3xl bg-[var(--color-surface-muted)] text-4xl">
        404
      </div>
      <h1 className="ui-heading-tight text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
        The page you tried to open does not exist or may have been moved.
      </p>
      <div className="mt-6 flex justify-center">
        <Link
          to="/"
          className="inline-flex items-center rounded-xl bg-[var(--color-role-accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm dark:shadow-slate-900/50 transition hover:opacity-95"
        >
          Back to home
        </Link>
      </div>
    </div>
  </div>
)

export default NotFound
