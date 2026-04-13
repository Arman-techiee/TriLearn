const test = require('node:test')
const assert = require('node:assert/strict')

const { sanitizePlainText } = require('../src/utils/sanitize')

test('sanitizePlainText strips html and control characters', () => {
  const input = '<p>Hello&nbsp;<strong>World</strong></p>\u0007'

  assert.equal(sanitizePlainText(input), 'Hello World')
})

test('sanitizePlainText removes dangerous HTML while preserving plain text content', () => {
  const input = '<svg><g onload=alert(1)></g></svg><p>Safe &amp; sound</p>'

  assert.equal(sanitizePlainText(input), 'Safe & sound')
})

test('sanitizePlainText collapses whitespace while preserving paragraph breaks', () => {
  const input = 'First line   \n\n\nSecond\t\tline'

  assert.equal(sanitizePlainText(input), 'First line\n\nSecond line')
})

test('sanitizePlainText returns an empty string for non-strings', () => {
  assert.equal(sanitizePlainText(null), '')
  assert.equal(sanitizePlainText(undefined), '')
  assert.equal(sanitizePlainText(42), '')
})
