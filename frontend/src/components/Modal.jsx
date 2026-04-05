import { X } from 'lucide-react'

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
    <div className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[--color-bg-card] dark:bg-slate-800 shadow-2xl dark:shadow-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <h2 className="ui-heading-tight text-xl font-bold text-[--color-text] dark:text-slate-100">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-slate-100 hover:text-[--color-text-muted] dark:text-slate-400"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {children}
      </div>
    </div>
  </div>
)

export default Modal
