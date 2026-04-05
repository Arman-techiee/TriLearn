import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const recoverFromChunkLoadError = () => {
  const reloadKey = 'trilearn:chunk-reload-attempted'

  if (sessionStorage.getItem(reloadKey) === 'true') {
    sessionStorage.removeItem(reloadKey)
    return
  }

  sessionStorage.setItem(reloadKey, 'true')
  window.location.reload()
}

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  recoverFromChunkLoadError()
})

window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || ''
  if (/Loading chunk [\d]+ failed|Failed to fetch dynamically imported module/i.test(message)) {
    recoverFromChunkLoadError()
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
