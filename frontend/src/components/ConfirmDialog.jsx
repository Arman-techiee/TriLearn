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
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700'

  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm leading-6 text-gray-600">{message}</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
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
