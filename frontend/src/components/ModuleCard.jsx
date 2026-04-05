import { motion } from 'framer-motion'
import { BookMarked, ChevronRight, GraduationCap } from 'lucide-react'

const ModuleCard = ({ module, index = 0 }) => {
  const progressTone =
    module.progress >= 80
      ? 'from-emerald-400 to-cyan-400'
      : module.progress >= 60
        ? 'from-violet-400 to-fuchsia-400'
        : 'from-amber-300 to-orange-400'

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="group rounded-[1.5rem] border border-slate-200 bg-[--color-bg-card] dark:bg-slate-800 p-5 shadow-sm dark:shadow-slate-900/50 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-600">
              Year {module.year}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              {module.code}
            </span>
          </div>
          <h3 className="line-clamp-2 text-lg font-bold tracking-tight text-slate-900">{module.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition group-hover:scale-110">
          {index % 2 === 0 ? <BookMarked className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">Progress</span>
          <span className="font-semibold text-slate-900">{module.progress}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 p-[2px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${module.progress}%` }}
            transition={{ duration: 0.8, delay: 0.15 + index * 0.04 }}
            className={`h-full rounded-full bg-gradient-to-r ${progressTone}`}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Module Status</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{module.progress >= 80 ? 'On Track' : module.progress >= 60 ? 'Steady Progress' : 'Needs Attention'}</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[--color-bg-card] dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Open
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  )
}

export default ModuleCard
