import Modal from './Modal'

const ConfirmDialog = ({
  open,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onClose
}) => {
  if (!open) return null

  const toneClasses = tone === 'danger'
    ? 'bg-accent-600 hover:bg-accent-700'
    : 'bg-primary hover:bg-primary'

  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm leading-6 text-[--color-text-muted] dark:text-slate-400">{message}</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="flex-1 rounded-lg border border-[--color-border] dark:border-slate-700 py-2 text-sm text-[--color-text-muted] dark:text-slate-400 hover:bg-[--color-bg] dark:bg-slate-900 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50 ${toneClasses}`}
        >
          {busy ? 'Please wait...' : confirmText}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
