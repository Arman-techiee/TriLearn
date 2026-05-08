import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

const Modal = ({ title, onClose, children }) => {
  const dialogRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const focusableElements = Array.from(dialogRef.current?.querySelectorAll(focusableSelector) || [])
    const firstFocusable = focusableElements[0] || dialogRef.current

    firstFocusable?.focus()
  }, [])

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }

    if (event.key !== 'Tab') return

    const focusableElements = Array.from(dialogRef.current?.querySelectorAll(focusableSelector) || [])
    if (focusableElements.length === 0) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
      return
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
    <div
      ref={dialogRef}
      className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[var(--color-card-surface)] shadow-2xl dark:shadow-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between border-b border-[var(--color-card-border)] px-6 py-5">
        <h2 id={titleId} className="ui-heading-tight text-xl font-bold text-[var(--color-heading)]">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-text-soft)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-muted)]"
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
}

export default Modal
