const EmptyState = ({
  icon = '📭',
  title = 'Nothing here yet',
  description = 'There is no data to show right now.',
  action
}) => (
  <div className="rounded-3xl border border-dashed border-gray-300 bg-gradient-to-br from-white to-gray-50 px-6 py-12 text-center">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
)

export default EmptyState
