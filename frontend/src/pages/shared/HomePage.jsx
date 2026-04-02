import { Link } from 'react-router-dom'

const highlights = [
  {
    title: 'Central Academic Hub',
    description: 'Manage routines, notices, attendance, assignments, marks, and study materials from one connected platform.'
  },
  {
    title: 'Role-Based Workspaces',
    description: 'Give admins, coordinators, instructors, students, and gatekeepers the exact tools they need without clutter.'
  },
  {
    title: 'Operational Visibility',
    description: 'Track student progress, publish updates quickly, and keep academic records organized across departments.'
  }
]

const roleCards = [
  {
    role: 'Administrators',
    detail: 'Set up departments, manage users, oversee notices, routines, and institutional operations.'
  },
  {
    role: 'Instructors',
    detail: 'Handle attendance, assignments, results, notices, and study materials for assigned subjects.'
  },
  {
    role: 'Students',
    detail: 'View routines, materials, assignments, results, attendance summaries, and campus announcements.'
  }
]

const stats = [
  { value: '5', label: 'core user roles' },
  { value: '1', label: 'shared academic workspace' },
  { value: '24/7', label: 'access to records and notices' }
]

const HomePage = () => (
  <div className="min-h-screen bg-[linear-gradient(180deg,#f3efe6_0%,#fffdf8_45%,#eef7f3_100%)] text-slate-900">
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <div>
          <p className="text-2xl font-black tracking-tight text-emerald-700">EduNexus</p>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Academic Management Platform</p>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>

    <main>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-24">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-sm font-semibold text-emerald-700">
            Built to connect campus operations end to end
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            One home for the daily rhythm of your institution.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            EduNexus helps schools and colleges bring academic coordination, classroom workflows, and student access
            into one organized digital system. From attendance and assignments to notices and results, the platform is
            designed to make campus communication faster and administration calmer.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/login"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Sign In to EduNexus
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <p className="text-3xl font-black text-emerald-700">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -rotate-3 rounded-[2rem] bg-[linear-gradient(135deg,#14532d_0%,#1d4ed8_100%)] opacity-90 shadow-[0_30px_80px_rgba(15,23,42,0.16)]" />
          <div className="relative rounded-[2rem] border border-white/30 bg-slate-950/90 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Inside EduNexus</p>
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl bg-white/8 p-5">
                <p className="text-lg font-semibold">Academic Coordination</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Publish routines, assign instructors, manage departments, and keep every subject aligned.
                </p>
              </div>
              <div className="rounded-2xl bg-white/8 p-5">
                <p className="text-lg font-semibold">Student Experience</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Students can check attendance, collect materials, submit work, and stay updated without chasing paper notices.
                </p>
              </div>
              <div className="rounded-2xl bg-white/8 p-5">
                <p className="text-lg font-semibold">Teaching Workflow</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Teachers can record attendance, upload materials, create assignments, and publish marks from one dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-7 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="rounded-[2rem] bg-slate-900 px-8 py-10 text-white shadow-[0_28px_80px_rgba(15,23,42,0.16)]">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Who It Serves</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight">A platform shaped around real campus roles.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                EduNexus is designed so each part of the institution can move faster without losing oversight. The result is
                less friction for staff and better visibility for students.
              </p>
            </div>
            <div className="grid flex-1 gap-4">
              {roleCards.map((card) => (
                <div key={card.role} className="rounded-2xl border border-white/10 bg-white/6 p-5">
                  <p className="text-lg font-semibold text-white">{card.role}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
        <div className="rounded-[2rem] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#eff6ff_100%)] p-8 shadow-[0_22px_60px_rgba(16,185,129,0.08)] sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Start with the right entry point.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Existing users can sign in directly to their dashboard and continue their academic workflow without extra steps.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
)

export default HomePage
