const test = require('node:test')
const assert = require('node:assert/strict')

const {
  normalizeQueueOptions
} = require('../src/jobs/notificationQueue')

test('normalizeQueueOptions replaces BullMQ-reserved separators in custom job ids', () => {
  const options = normalizeQueueOptions({
    attempts: 1,
    jobId: 'notice:notice-1:user-1'
  })

  assert.deepEqual(options, {
    attempts: 1,
    jobId: 'notice-notice-1-user-1'
  })
})

test('normalizeQueueOptions leaves safe options unchanged', () => {
  const originalOptions = {
    attempts: 1,
    jobId: 'student-import-1'
  }

  assert.equal(normalizeQueueOptions(originalOptions), originalOptions)
})
