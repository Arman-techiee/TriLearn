const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { createRequire } = require('node:module')

const resolveFromTest = (...segments) => path.resolve(__dirname, '..', ...segments)

const loadWithMocks = (targetPath, mocks) => {
  const modulePath = path.resolve(targetPath)
  const localRequire = createRequire(modulePath)
  const touched = []

  for (const [request, mockExports] of Object.entries(mocks)) {
    const resolved = localRequire.resolve(request)
    touched.push({
      resolved,
      previous: require.cache[resolved]
    })
    require.cache[resolved] = {
      id: resolved,
      filename: resolved,
      loaded: true,
      exports: mockExports
    }
  }

  delete require.cache[modulePath]

  try {
    return require(modulePath)
  } finally {
    delete require.cache[modulePath]
    touched.forEach(({ resolved, previous }) => {
      if (previous) {
        require.cache[resolved] = previous
      } else {
        delete require.cache[resolved]
      }
    })
  }
}

test('scheduleMaintenance runs closed-routine absence sync on startup', async () => {
  let syncCalls = 0

  const { scheduleMaintenance } = loadWithMocks(resolveFromTest('src', 'utils', 'maintenance.js'), {
    './logger': {
      info: () => {},
      warn: () => {},
      error: () => {}
    },
    '../jobs/cleanupTokens': {
      startTokenCleanupJob: () => ({
        stop: () => {}
      })
    },
    './notifications': {
      createNotifications: async () => {}
    },
    '../controllers/attendance/shared': {
      syncClosedRoutineAbsences: async () => {
        syncCalls += 1
      }
    }
  })

  const maintenance = scheduleMaintenance({
    auditLog: {
      deleteMany: async () => ({ count: 0 })
    },
    assignment: {
      findMany: async () => []
    }
  })

  await new Promise((resolve) => setTimeout(resolve, 0))
  maintenance.stop()

  assert.equal(syncCalls, 1)
})
