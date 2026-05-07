const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { createRequire } = require('node:module')

const resolveFromTest = (...segments) => path.resolve(__dirname, '..', ...segments)

const loadWithMocks = (targetPath, mocks) => {
  const modulePath = path.resolve(targetPath)
  const localRequire = createRequire(modulePath)
  const sourceRoot = resolveFromTest('src')
  const previousCacheKeys = new Set(Object.keys(require.cache))
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
    for (const cachedPath of Object.keys(require.cache)) {
      if (!previousCacheKeys.has(cachedPath) && cachedPath.startsWith(sourceRoot)) {
        delete require.cache[cachedPath]
      }
    }

    touched.forEach(({ resolved, previous }) => {
      if (previous) {
        require.cache[resolved] = previous
      } else {
        delete require.cache[resolved]
      }
    })
  }
}

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  headers: {},
  status(code) {
    this.statusCode = code
    return this
  },
  json(payload) {
    this.body = payload
    return this
  },
  setHeader(name, value) {
    this.headers[name] = value
    return this
  },
  internalError(error) {
    throw error
  }
})

test('exportMyMarksheetPdf streams a PDF marksheet for published student marks', async () => {
  const writtenText = []
  class MockPdfDocument {
    constructor(options) {
      this.options = options
      this.y = 40
      this.stream = null
    }

    pipe(stream) {
      this.stream = stream
      return stream
    }

    fontSize() {
      return this
    }

    fillColor() {
      return this
    }

    text(value) {
      writtenText.push(String(value))
      this.y += 12
      return this
    }

    moveDown() {
      this.y += 12
      return this
    }

    addPage() {
      this.y = 40
      return this
    }

    end() {
      this.stream?.end(Buffer.from('%PDF-1.4\nmock marksheet\n'))
    }
  }

  const marks = [
    {
      id: 'mark-1',
      studentId: 'student-1',
      subjectId: 'subject-1',
      obtainedMarks: 91,
      totalMarks: 100,
      grade: 'A+',
      gradePoint: 4,
      remarks: 'Excellent',
      subject: { name: 'Database Systems', code: 'DBS101', semester: 3 }
    }
  ]

  const { exportMyMarksheetPdf } = loadWithMocks(resolveFromTest('src', 'controllers', 'marks.controller.js'), {
    '../utils/prisma': {
      mark: {
        findMany: async (payload) => {
          if (payload.distinct) {
            return [{ examType: 'FINAL' }]
          }

          return marks
        },
        count: async () => marks.length
      },
      student: {
        findUnique: async () => ({
          id: 'student-1',
          rollNumber: 'BCA-001',
          semester: 3,
          section: 'A',
          department: 'BCA',
          user: {
            name: 'Student One',
            email: 'student@example.com'
          }
        })
      },
      $queryRaw: async () => [{ studentId: 'student-1', rank: 1, cohortSize: 12 }]
    },
    '../utils/pagination': {
      getPagination: () => ({ page: 1, limit: 10, skip: 0 })
    },
    '../utils/audit': {
      recordAuditLog: async () => {}
    },
    '../utils/notifications': {
      createNotifications: async () => {}
    },
    pdfkit: MockPdfDocument
  })

  const req = {
    query: { examType: 'FINAL' },
    student: { id: 'student-1', semester: 3, department: 'BCA' }
  }
  const res = createResponse()

  await exportMyMarksheetPdf(req, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['Content-Type'], 'application/pdf')
  assert.equal(
    res.headers['Content-Disposition'],
    'attachment; filename="marksheet-bca-001-sem-3-final.pdf"'
  )
  assert.ok(writtenText.includes('TriLearn Semester Marksheet'))
  assert.ok(writtenText.includes('Student: Student One'))
  assert.ok(writtenText.includes('1. Database Systems (DBS101)'))
})

test('addMarksBulk creates sanitized marks for enrolled students', async () => {
  const createCalls = []
  const auditCalls = []
  const { addMarksBulk } = loadWithMocks(resolveFromTest('src', 'controllers', 'marks.controller.js'), {
    '../utils/prisma': {
      subject: {
        findUnique: async () => ({
          id: 'subject-1',
          instructorId: 'instructor-1',
          instructor: {
            id: 'instructor-1',
            user: { name: 'Instructor One', email: 'instructor@example.com' }
          }
        })
      },
      subjectEnrollment: {
        findMany: async () => ([
          { studentId: 'student-1' },
          { studentId: 'student-2' }
        ])
      },
      mark: {
        findMany: async () => [],
        create: (payload) => {
          createCalls.push(payload)
          return Promise.resolve({
            id: `mark-${createCalls.length}`,
            studentId: payload.data.studentId,
            subjectId: payload.data.subjectId,
            obtainedMarks: payload.data.obtainedMarks,
            totalMarks: payload.data.totalMarks,
            grade: payload.data.grade,
            gradePoint: payload.data.gradePoint,
            remarks: payload.data.remarks,
            student: { user: { name: `Student ${createCalls.length}` } },
            subject: { name: 'Database Systems', code: 'DBS101' }
          })
        }
      },
      auditLog: {
        createMany: async (payload) => {
          auditCalls.push(payload)
          return { count: payload.data.length }
        }
      },
      $transaction: async (operations) => Promise.all(operations)
    },
    '../utils/pagination': {
      getPagination: () => ({ page: 1, limit: 10, skip: 0 })
    },
    '../utils/audit': {
      recordAuditLog: async () => {}
    },
    '../utils/notifications': {
      createNotifications: async () => {}
    },
    pdfkit: class MockPdfDocument {}
  })

  const req = {
    body: {
      subjectId: 'subject-1',
      examType: 'FINAL',
      totalMarks: 100,
      entries: [
        { studentId: 'student-1', obtainedMarks: 88, remarks: '<b>Great&nbsp;work</b>' },
        { studentId: 'student-2', obtainedMarks: 72, remarks: '<img src=x onerror=1>Solid' }
      ]
    },
    user: { id: 'instructor-user-1', role: 'INSTRUCTOR' },
    instructor: { id: 'instructor-1' }
  }
  const res = createResponse()

  await addMarksBulk(req, res)

  assert.equal(res.statusCode, 201)
  assert.equal(res.body.count, 2)
  assert.equal(createCalls.length, 2)
  assert.equal(createCalls[0].data.remarks, 'Great work')
  assert.equal(createCalls[1].data.remarks, 'Solid')
  assert.equal(createCalls[0].data.isPublished, false)
  assert.equal(auditCalls.length, 1)
  assert.equal(auditCalls[0].data.length, 2)
})

test('bulk import controller queues an uploaded student import and exposes job status', async () => {
  const contexts = []
  const { importStudents, getStudentImportJob } = loadWithMocks(resolveFromTest('src', 'controllers', 'bulkImport.controller.js'), {
    '../services/bulkImport.service': {
      importStudents: async (context, result) => {
        contexts.push(context)
        return result.withStatus(202, {
          message: 'Student import queued.',
          jobId: 'job-1',
          statusUrl: '/api/v1/admin/users/student-import/job-1'
        })
      },
      getStudentImportJob: async (context, result) => result.ok({
        id: context.params.jobId,
        state: 'completed',
        progress: 100,
        failedReason: null,
        result: { summary: { created: 2, failed: 0 } }
      })
    }
  })

  const uploadReq = {
    file: {
      path: 'uploads/import.csv',
      originalname: 'students.csv',
      filename: 'students.csv',
      mimetype: 'text/csv',
      size: 128
    },
    user: { id: 'admin-1', role: 'ADMIN' }
  }
  const uploadRes = createResponse()

  await importStudents(uploadReq, uploadRes)

  assert.equal(uploadRes.statusCode, 202)
  assert.equal(uploadRes.body.jobId, 'job-1')
  assert.equal(contexts[0].file.path, 'uploads/import.csv')
  assert.equal(contexts[0].user.role, 'ADMIN')

  const statusRes = createResponse()
  await getStudentImportJob({ params: { jobId: 'job-1' } }, statusRes)

  assert.equal(statusRes.statusCode, 200)
  assert.equal(statusRes.body.state, 'completed')
  assert.equal(statusRes.body.result.summary.created, 2)
})
