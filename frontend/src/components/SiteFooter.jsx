import { Building2, LifeBuoy, ShieldCheck } from 'lucide-react'
import BrandLogo from './BrandLogo'

const SiteFooter = ({ compact = false }) => {
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-[var(--color-card-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.75)_0%,rgba(232,239,249,0.82)_100%)] dark:bg-[linear-gradient(180deg,rgba(8,17,32,0.78)_0%,rgba(9,23,41,0.9)_100%)]">
      <div className={`mx-auto grid max-w-7xl gap-8 px-6 ${compact ? 'py-8 lg:py-9' : 'py-10 lg:py-12'} lg:grid-cols-[1.1fr_0.9fr] lg:px-10`}>
        <div>
          <BrandLogo theme="light" size="md" />
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--color-text-muted)]">
            TriLearn helps institutions run day-to-day academic operations with structure, clarity, and role-based control.
          </p>
          <div className={`mt-5 flex flex-wrap items-center gap-3 ${compact ? 'hidden sm:flex' : ''}`}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Secure role-based workflows
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Built for academic teams
            </span>
          </div>
        </div>

        <div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-soft)]">Support</h3>
            <div className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
              <p className="flex items-start gap-2">
                <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Need onboarding assistance? Coordinate with your institution administrator for account setup.</span>
              </p>
              <p>Monitored for institutional academic operations and daily campus usage.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-card-border)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-4 text-xs text-[var(--color-text-soft)] sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>© {year} TriLearn. All rights reserved.</p>
          <p>Professional Academic Operations Platform</p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
