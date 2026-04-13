const test = require('node:test')
const assert = require('node:assert/strict')

const { buildCorsOriginValidator } = require('../src/utils/realtime')

const runValidator = (validator, origin) => new Promise((resolve) => {
  validator(origin, (error, allowed) => {
    resolve({ error, allowed })
  })
})

test('buildCorsOriginValidator rejects null origin outside development', async () => {
  const originalNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'

  try {
    const validator = buildCorsOriginValidator(['http://localhost:5173'])
    const result = await runValidator(validator, undefined)

    assert.equal(result.allowed, undefined)
    assert.match(result.error?.message || '', /Not allowed by CORS/)
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = originalNodeEnv
    }
  }
})

test('buildCorsOriginValidator allows null origin in development', async () => {
  const originalNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'development'

  try {
    const validator = buildCorsOriginValidator(['http://localhost:5173'])
    const result = await runValidator(validator, undefined)

    assert.equal(result.error, null)
    assert.equal(result.allowed, true)
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = originalNodeEnv
    }
  }
})

test('buildCorsOriginValidator allows explicitly trusted origins', async () => {
  const validator = buildCorsOriginValidator(['http://localhost:5173'])
  const result = await runValidator(validator, 'http://localhost:5173')

  assert.equal(result.error, null)
  assert.equal(result.allowed, true)
})
