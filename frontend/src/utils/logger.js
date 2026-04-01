const logger = {
  error: (...args) => {
    if (import.meta.env.DEV) {
      console.error(...args)
    }
  },
  info: (...args) => {
    if (import.meta.env.DEV) {
      console.info(...args)
    }
  }
}

export default logger
