import { Link } from 'react-router-dom'

const buttonVariants = {
  primary: 'border border-transparent bg-[var(--color-role-accent)] text-white shadow-sm hover:brightness-95',
  secondary: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
  danger: 'border border-red-100 bg-red-50 text-red-600 hover:bg-red-100'
}

const renderAction = (action, index) => {
  const Icon = action.icon
  const classes = `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${buttonVariants[action.variant || 'secondary']}`
  const content = (
    <>
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{action.label}</span>
    </>
  )

  if (action.to) {
    return (
      <Link key={action.key || action.label || index} to={action.to} className={classes}>
        {content}
      </Link>
    )
  }

  if (action.href) {
    return (
      <a
        key={action.key || action.label || index}
        href={action.href}
        target={action.target}
        rel={action.rel}
        className={classes}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      key={action.key || action.label || index}
      type={action.type || 'button'}
      onClick={action.onClick}
      disabled={action.disabled}
      className={`${classes} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {content}
    </button>
  )
}

const PageHeader = ({ title, subtitle, actions = [], breadcrumbs = [] }) => (
  <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div className="min-w-0">
      {breadcrumbs.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {breadcrumbs.map((crumb, index) => {
            const label = typeof crumb === 'string' ? crumb : crumb.label
            return (
              <span key={`${label}-${index}`} className="inline-flex items-center gap-2">
                {index > 0 ? <span>/</span> : null}
                {label}
              </span>
            )
          })}
        </div>
      ) : null}
      <h1 className="ui-heading-tight text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    </div>

    {actions.length > 0 ? (
      <div className="flex flex-wrap gap-3">
        {actions.map(renderAction)}
      </div>
    ) : null}
  </div>
)

export default PageHeader
