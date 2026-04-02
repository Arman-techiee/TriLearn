import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const initialsFromName = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'

const roleThemeClasses = {
  admin: 'ui-role-accent-admin',
  instructor: 'ui-role-accent-instructor',
  student: 'ui-role-accent-student',
  gate: 'ui-role-accent-gate'
}

const AppShell = ({
  brand = 'EduNexus',
  roleLabel,
  roleTheme = 'admin',
  user,
  sidebarItems,
  topItems = [],
  activePath,
  onLogout,
  children
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const roleThemeClass = roleThemeClasses[roleTheme] || roleThemeClasses.admin

  return (
    <div className={`min-h-screen bg-slate-100 text-slate-900 ${roleThemeClass}`} data-role-theme={roleTheme}>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="mx-auto flex min-h-screen max-w-[1700px] gap-4 p-4 md:gap-6 md:p-6">
        <aside
          className={`ui-sidebar-shell fixed inset-y-4 left-4 z-40 flex w-[260px] flex-col overflow-hidden rounded-[1.75rem] border shadow-sm transition-[width,transform] duration-300 ease-out md:static md:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-[120%]'
          } ${sidebarCollapsed ? 'md:w-[72px]' : 'md:w-[260px]'}`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
            <div className="flex min-w-0 items-start gap-3 overflow-hidden">
              <div className="ui-role-fill flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-[0_18px_40px_rgba(15,23,42,0.28)]">
                EN
              </div>
              <div className={`min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-300 ${
                sidebarCollapsed ? 'max-w-0 translate-x-2 opacity-0' : 'max-w-[160px] opacity-100'
              }`}>
                <p className="ui-heading-tight truncate text-lg font-bold text-white">{brand}</p>
                <span className="ui-role-surface ui-role-ring mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
                  {roleLabel}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setSidebarCollapsed((value) => !value)}
                className="hidden rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 md:block"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 md:hidden"
                aria-label="Close sidebar"
              >
                x
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-2 p-3">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = item.path && activePath === item.path

              const content = (
                <div
                  className={`flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition ${
                    isActive
                      ? 'border-l-4 border-l-[var(--color-role-accent)] bg-white text-[var(--color-role-accent)] shadow-[0_16px_38px_-24px_rgba(15,23,42,0.7)]'
                      : item.disabled
                        ? 'text-slate-500'
                        : 'text-slate-200 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    isActive ? 'bg-slate-100' : 'bg-white/8'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className={`min-w-0 flex-1 overflow-hidden transition-[max-width,opacity,transform] duration-300 ${
                    sidebarCollapsed ? 'max-w-0 translate-x-2 opacity-0' : 'max-w-[160px] opacity-100'
                  }`}>
                    <p className="truncate text-sm font-semibold">{item.label}</p>
                    <p className={`truncate text-xs ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>{item.meta}</p>
                  </div>
                </div>
              )

              if (item.disabled) {
                return (
                  <button key={item.label} type="button" disabled className="block w-full cursor-not-allowed text-left">
                    {content}
                  </button>
                )
              }

              return (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className="block">
                  {content}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-white/10 p-3">
            <div className={`mb-3 flex items-center gap-3 rounded-2xl bg-white/8 px-3 py-3 transition ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}>
              <div className="ui-role-fill flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black shadow-[0_16px_36px_rgba(15,23,42,0.28)]">
                {initialsFromName(user?.name)}
              </div>
              <div className={`min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-300 ${
                sidebarCollapsed ? 'max-w-0 translate-x-2 opacity-0' : 'max-w-[150px] opacity-100'
              }`}>
                <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-300">{user?.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/8 hover:text-white ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={`overflow-hidden transition-[max-width,opacity,transform] duration-300 ${
                sidebarCollapsed ? 'max-w-0 translate-x-2 opacity-0' : 'max-w-[120px] opacity-100'
              }`}>
                Logout
              </span>
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-6">
          <header className="ui-card rounded-[1.75rem] px-4 py-4 md:px-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="rounded-2xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50 md:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{roleLabel}</p>
                    <h1 className="ui-heading-tight text-xl font-bold text-slate-900">Workspace</h1>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <div className="ui-role-fill flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black text-white">
                    {initialsFromName(user?.name)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1">
                {topItems.map((item) => {
                  const Icon = item.icon
                  const isActive = item.path && activePath === item.path

                  if (!item.path) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        disabled
                        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'border-[var(--color-role-accent)] bg-[var(--color-role-accent)] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive ? 'bg-white/15 text-white' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default AppShell
