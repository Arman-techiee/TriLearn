import { ArrowRight, CalendarDays, FileText, GraduationCap, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo'

const featureCards = [
  {
    title: 'Weekly academic coordination',
    description: 'Publish routines, align departments, and keep the weekly teaching plan visible from one place.',
    icon: CalendarDays
  },
  {
    title: 'Teaching and records workflow',
    description: 'Manage attendance, assignments, materials, and marks without splitting work across disconnected tools.',
    icon: GraduationCap
  },
  {
    title: 'Secure role-based access',
    description: 'Give every role a focused workspace with the controls and visibility they actually need.',
    icon: ShieldCheck
  }
]

const overviewStats = [
  { value: '5', label: 'role-aware workspaces' },
  { value: '1', label: 'academic operating system' },
  { value: 'Sun', label: 'first day of weekly routine view' }
]

const HomePage = () => (
  <div className="min-h-screen bg-[linear-gradient(180deg,#f6f8fc_0%,#f2f5f9_52%,#edf3f0_100%)] text-[var(--color-page-text)]">
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/82 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <BrandLogo theme="light" size="md" />
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
        >
          <span>Sign In</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>

    <main>
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-1.5 text-sm font-semibold text-primary shadow-sm">
              <FileText className="h-4 w-4" />
              <span>Academic management with a clearer weekly rhythm</span>
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.04] tracking-[-0.05em] text-[var(--color-heading)] sm:text-5xl lg:text-7xl">
              One professional workspace for the full academic cycle.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-muted)]">
              TriLearn helps institutions coordinate routines, classroom workflows, notices, study materials, assignments,
              attendance, and results in one organized platform that feels reliable day after day.
            </p>
            <div className="mt-8">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <span>Enter the Platform</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {overviewStats.map((stat) => (
                <div key={stat.label} className="rounded-[1.5rem] border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-5 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.04)]">
                  <p className="text-3xl font-black tracking-tight text-primary">{stat.value}</p>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#0f172a_0%,#17253c_100%)] p-7 text-white shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
            <div className="flex items-center justify-between">
              <BrandLogo theme="dark" size="sm" />
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
                Weekly Control
              </span>
            </div>
            <div className="mt-8 space-y-4">
              {[
                ['Sunday start', 'Begin the academic week with the routine visible from the first day.'],
                ['Routine and notices', 'Keep teaching schedules and communication aligned in the same workflow.'],
                ['Operational clarity', 'Reduce coordination gaps across departments, instructors, and students.']
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/6 px-5 py-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon
            return (
              <article key={card.title} className="rounded-[1.7rem] border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-7 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary dark:bg-primary-950/30 dark:text-primary-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-[var(--color-heading)]">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">{card.description}</p>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  </div>
)

export default HomePage
