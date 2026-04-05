const logger = {
  info: (...args) => {
    if (__DEV__) {
      console.log('[mobile]', ...args)
    }
  },
  warn: (...args) => {
    if (__DEV__) {
      console.warn('[mobile]', ...args)
    }
  },
  error: (...args) => {
    console.error('[mobile]', ...args)
  }
}

export default logger
