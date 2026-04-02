const logger = {
  error: (...args) => {
    const normalizedArgs = args.length === 0
      ? ['Unexpected frontend error']
      : args
    console.error(...normalizedArgs)
  },
  info: (...args) => {
    if (import.meta.env.DEV) {
      console.info(...args)
    }
  }
}

export default logger
