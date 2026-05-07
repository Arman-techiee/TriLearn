const clampHeight = (value) => Math.max(10, Math.min(100, value))

const SimpleBarChart = ({ data = [] }) => {
  if (!data.length) {
    return null
  }

  return (
    <div
      className="mt-6 rounded-2xl border p-4"
      style={{
        borderColor: 'var(--color-card-border)',
        background: 'var(--color-surface-muted)'
      }}
    >
      <div className="flex h-64 items-end gap-3 overflow-x-auto">
        {data.map((item) => (
          <div key={item.subjectCode} className="flex min-w-[72px] flex-1 flex-col items-center gap-3">
            <div className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              {item.percentage}%
            </div>
            <div
              className="flex h-44 w-full items-end rounded-2xl px-2 py-2 shadow-sm"
              style={{ background: 'var(--color-card-surface)' }}
            >
              <div
                className="w-full rounded-xl bg-[linear-gradient(180deg,#2563eb_0%,#0f766e_100%)]"
                style={{ height: `${clampHeight(item.percentage)}%` }}
                title={`${item.subjectName}: ${item.percentage}%`}
              />
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold" style={{ color: 'var(--color-heading)' }}>
                {item.subjectCode}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {item.grade}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SimpleBarChart
