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

test('enrollStudentInMatchingSubjects targets shared and department subjects', async () => {
  const calls = []
  const modulePath = path.resolve(__dirname, '../src/utils/enrollment.js')
  const { enrollStudentInMatchingSubjects } = loadWithMocks(modulePath, {
    './prisma': {
      subject: {
        findMany: async (payload) => {
          calls.push(payload)
          return [{ id: 'subject-1' }, { id: 'subject-2' }]
        }
      },
      subjectEnrollment: {
        createMany: async () => ({ count: 2 })
      }
    }
  })

  const result = await enrollStudentInMatchingSubjects({
    studentId: 'student-1',
    semester: 3,
    department: 'BCA'
  })

  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].where, {
    semester: 3,
    OR: [
      { department: null },
      { department: '' },
      { department: 'BCA' }
    ]
  })
  assert.deepEqual(result, {
    enrolledCount: 2,
    subjectIds: ['subject-1', 'subject-2']
  })
})

test('syncMatchingStudentsForSubject returns empty state when no students match', async () => {
  const transactions = []
  const deleteCalls = []
  const modulePath = path.resolve(__dirname, '../src/utils/enrollment.js')
  const { syncMatchingStudentsForSubject } = loadWithMocks(modulePath, {
    './prisma': {
      student: {
        findMany: async () => []
      },
      subjectEnrollment: {
        deleteMany: (payload) => {
          deleteCalls.push(payload)
          return ({ action: 'deleteMany', payload })
        },
        createMany: (payload) => ({ action: 'createMany', payload })
      },
      $transaction: async (operations) => {
        transactions.push(operations)
        return operations
      }
    }
  })

  const result = await syncMatchingStudentsForSubject({
    subjectId: 'subject-77',
    semester: 5,
    department: 'BIM'
  })

  assert.equal(transactions.length, 0)
  assert.equal(deleteCalls.length, 0)
  assert.deepEqual(result, {
    enrolledCount: 0,
    studentIds: []
  })
})

test('syncStudentEnrollmentForSemester removes obsolete enrollments and adds matching semester subjects', async () => {
  const transactions = []
  const deleteCalls = []
  const createCalls = []
  const modulePath = path.resolve(__dirname, '../src/utils/enrollment.js')
  const { syncStudentEnrollmentForSemester } = loadWithMocks(modulePath, {
    './prisma': {
      subject: {
        findMany: async () => [{ id: 'subject-4a' }, { id: 'subject-4b' }]
      },
      subjectEnrollment: {
        findMany: async () => ([
          { subjectId: 'subject-3a', subject: { semester: 3, department: 'BCA' } },
          { subjectId: 'subject-4a', subject: { semester: 4, department: 'BCA' } }
        ]),
        deleteMany: (payload) => {
          deleteCalls.push(payload)
          return { action: 'deleteMany', payload }
        },
        createMany: (payload) => {
          createCalls.push(payload)
          return { action: 'createMany', payload }
        }
      },
      $transaction: async (operations) => {
        transactions.push(operations)
        return operations
      }
    }
  })

  const result = await syncStudentEnrollmentForSemester({
    studentId: 'student-1',
    semester: 4,
    department: 'BCA'
  })

  assert.equal(transactions.length, 1)
  assert.deepEqual(deleteCalls[0], {
    where: {
      studentId: 'student-1',
      subjectId: { in: ['subject-3a'] }
    }
  })
  assert.deepEqual(createCalls[0], {
    data: [
      { subjectId: 'subject-4a', studentId: 'student-1' },
      { subjectId: 'subject-4b', studentId: 'student-1' }
    ],
    skipDuplicates: true
  })
  assert.deepEqual(result, {
    enrolledCount: 2,
    subjectIds: ['subject-4a', 'subject-4b'],
    removedCount: 1,
    removedSubjectIds: ['subject-3a']
  })
})
