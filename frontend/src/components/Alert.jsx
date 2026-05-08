const styles = {
  success: 'status-present',
  error: 'status-absent',
  info: 'status-info'
}

const Alert = ({ type, message }) => {
  if (!message) return null

  return (
    <div
      className={`${styles[type] || styles.info} mb-4 rounded-lg border px-4 py-3 text-sm`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {message}
    </div>
  )
}

export default Alert
