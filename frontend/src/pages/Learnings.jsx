import { Search, BookOpenText, CheckCircle2, Clock3, Percent, Mail, IdCard, Sparkles } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { motion } from 'framer-motion'
import ModuleCard from '../components/ModuleCard'
import StatsStrip from '../components/StatsStrip'
import StudentLayout from '../layouts/StudentLayout'
import { useAuth } from '../context/AuthContext'

const modules = [
  { id: 1, name: 'Advanced Web Interfaces', code: 'CS401', year: 4, progress: 86, description: 'Responsive interface design, state orchestration, and polished client-side experiences.' },
  { id: 2, name: 'Distributed Systems Concepts', code: 'CS404', year: 4, progress: 74, description: 'Fault tolerance, service coordination, and scalable architecture patterns.' },
  { id: 3, name: 'Applied Machine Intelligence', code: 'AI320', year: 3, progress: 91, description: 'Model evaluation, prompt workflows, and practical AI system design.' },
  { id: 4, name: 'Human Computer Interaction', code: 'UX305', year: 3, progress: 68, description: 'Usability heuristics, research synthesis, and interaction prototypes.' },
  { id: 5, name: 'Secure Software Engineering', code: 'SE410', year: 4, progress: 79, description: 'Threat modeling, secure implementation, and production hardening practices.' },
  { id: 6, name: 'Cloud Infrastructure Studio', code: 'CL302', year: 3, progress: 57, description: 'Deployment pipelines, monitoring fundamentals, and service automation.' },
  { id: 7, name: 'Data Visualization Narratives', code: 'DS315', year: 3, progress: 83, description: 'Visual analysis, storytelling dashboards, and decision-ready reporting.' },
  { id: 8, name: 'Mobile Product Engineering', code: 'MB280', year: 2, progress: 64, description: 'Cross-platform interaction patterns, performance, and release quality.' }
]

const Learnings = () => {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  const filteredModules = modules.filter((module) => {
    const value = deferredQuery.trim().toLowerCase()
    if (!value) return true

    return [module.name, module.code, String(module.year)]
      .join(' ')
      .toLowerCase()
      .includes(value)
  })

  const completedCount = modules.filter((module) => module.progress >= 80).length
  const pendingCount = modules.filter((module) => module.progress < 80).length
  const averageProgress = Math.round(modules.reduce((sum, module) => sum + module.progress, 0) / modules.length)

  const stats = [
    { label: 'Total Enrolled', value: modules.length, help: 'Active modules this term', icon: BookOpenText, color: 'from-violet-500 to-fuchsia-500' },
    { label: 'Completed', value: completedCount, help: 'Modules above 80% progress', icon: CheckCircle2, color: 'from-emerald-500 to-cyan-500' },
    { label: 'Pending', value: pendingCount, help: 'Modules still in progress', icon: Clock3, color: 'from-amber-400 to-orange-500' },
    { label: 'Attendance', value: '92%', help: 'Current attendance average', icon: Percent, color: 'from-blue-500 to-indigo-500' }
  ]

  return (
    <StudentLayout noticesCount={4}>
      <div className="space-y-6 p-1">
        <StatsStrip items={stats} />

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.65fr)_360px]">
          <div className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-slate-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    Academic Pulse
                  </p>
                  <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">My Learnings</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Track the subjects you are enrolled in, monitor progress at a glance, and quickly focus on the modules that need more attention this week.
                  </p>
                </div>

                <label className="flex w-full max-w-md items-center gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search modules by name, code, or year"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>
            </motion.section>

            <div className="grid gap-5 lg:grid-cols-2">
              {filteredModules.map((module, index) => (
                <ModuleCard key={module.id} module={module} index={index} />
              ))}
            </div>

            {filteredModules.length === 0 ? (
              <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-600">
                No modules matched <span className="font-semibold text-slate-900">{deferredQuery}</span>.
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <motion.aside
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-slate-900 text-2xl font-black text-white">
                  {(user?.name || 'Student User')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('')}
                </div>
                <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900">{user?.name || 'Student User'}</h3>
                <p className="mt-1 text-sm text-slate-500">Bachelor of Computer Science</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Email</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{user?.email || 'student@edunexus.edu'}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <IdCard className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Student ID</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{user?.studentId || 'SUN-24-0418'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-600">Performance Snapshot</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 2xl:grid-cols-1">
                  <div>
                    <p className="text-2xl font-black text-slate-900">{averageProgress}%</p>
                    <p className="text-sm text-slate-600">Average progress</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">3</p>
                    <p className="text-sm text-slate-600">Upcoming tasks this week</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">2</p>
                    <p className="text-sm text-slate-600">Notices awaiting review</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}

export default Learnings
