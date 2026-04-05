import { useEffect, useState } from 'react'

const useUnsavedChangesGuard = (enabled) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setDialogOpen(false)
      return undefined
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled])

  const stayOnPage = () => {
    setDialogOpen(false)
  }

  const leavePage = () => {
    setDialogOpen(false)
  }

  return {
    dialogOpen,
    leavePage,
    stayOnPage
  }
}

export default useUnsavedChangesGuard
