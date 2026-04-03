const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { createRequire } = require('node:module')

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

const createResponse = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    cookies: [],
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
    cookie(...args) {
      this.cookies.push(args)
      return this
    },
    internalError(error) {
      throw error
    }
  }

  return res
}

test('login returns generic invalid credentials when user does not exist', async () => {
  process.env.QR_SIGNING_SECRET = 'test-qr-secret'

  const { login } = loadWithMocks('C:\\Users\\arman\\EduNexus\\backend\\src\\controllers\\auth.controller.js', {
    '../utils/prisma': {
      user: {
        findUnique: async () => null
      }
    },
    'bcryptjs': {
      compare: async () => false,
      hash: async () => 'hashed'
    },
    '../utils/enrollment': {
      enrollStudentInMatchingSubjects: async () => {}
    },
    '../utils/logger': {
      info: () => {},
      error: () => {}
    },
    '../utils/token': {
      signAccessToken: () => 'access-token',
      signRefreshToken: () => 'refresh-token',
      verifyRefreshToken: () => ({ id: 'user-1' }),
      hashToken: () => 'hash',
      getRefreshTokenExpiry: () => new Date(),
      getRefreshCookieOptions: () => ({})
    },
    'qrcode': {
      toDataURL: async () => 'data:image/png;base64,qr'
    }
  })

  const req = {
    body: {
      email: 'missing@example.com',
      password: 'wrong-password'
    }
  }
  const res = createResponse()

  await login(req, res)

  assert.equal(res.statusCode, 401)
  assert.deepEqual(res.body, { message: 'Invalid credentials' })
})

test('allowRoles blocks unauthorized roles with 403', async () => {
  const { allowRoles } = loadWithMocks('C:\\Users\\arman\\EduNexus\\backend\\src\\middleware\\auth.middleware.js', {
    '../utils/prisma': {
      user: {
        findUnique: async () => null
      }
    },
    '../utils/logger': {
      error: () => {}
    }
  })

  const middleware = allowRoles('ADMIN', 'COORDINATOR')
  const req = { user: { role: 'STUDENT' } }
  const res = createResponse()
  let nextCalled = false

  middleware(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 403)
  assert.deepEqual(res.body, {
    message: 'Access denied. Only ADMIN, COORDINATOR can do this.'
  })
})

test('getAdminStats returns server-side aggregate counts', async () => {
  const { getAdminStats } = loadWithMocks('C:\\Users\\arman\\EduNexus\\backend\\src\\controllers\\admin.controller.js', {
    '../utils/prisma': {
      user: {
        count: async ({ where } = {}) => {
          if (!where) return 42
          if (where.role === 'STUDENT') return 30
          if (where.role === 'INSTRUCTOR') return 7
          if (where.role === 'COORDINATOR') return 3
          if (where.role === 'GATEKEEPER') return 2
          return 0
        }
      },
      subject: {
        count: async () => 18
      }
    },
    'bcryptjs': {
      hash: async () => 'hashed'
    },
    '../utils/enrollment': {
      enrollStudentInMatchingSubjects: async () => {}
    },
    '../utils/logger': {
      error: () => {}
    },
    './department.controller': {
      ensureDepartmentExists: async () => true
    },
    '../utils/audit': {
      recordAuditLog: async () => {}
    }
  })

  const res = createResponse()
  await getAdminStats({}, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, {
    stats: {
      totalUsers: 42,
      totalStudents: 30,
      totalInstructors: 7,
      totalCoordinators: 3,
      totalGatekeepers: 2,
      totalSubjects: 18
    }
  })
})
