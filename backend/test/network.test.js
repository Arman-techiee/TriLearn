const test = require('node:test')
const assert = require('node:assert/strict')
const { isPrivateIpv4, isPrivateIpv6, normalizeIpAddress } = require('../src/utils/network')

test('isPrivateIpv4 identifies RFC1918 and localhost ranges', () => {
  assert.equal(isPrivateIpv4('10.10.10.10'), true)
  assert.equal(isPrivateIpv4('172.16.0.1'), true)
  assert.equal(isPrivateIpv4('192.168.1.20'), true)
  assert.equal(isPrivateIpv4('127.0.0.1'), true)
  assert.equal(isPrivateIpv4('8.8.8.8'), false)
})

test('isPrivateIpv6 identifies local and unique local addresses', () => {
  assert.equal(isPrivateIpv6('::1'), true)
  assert.equal(isPrivateIpv6('fd12:3456::1'), true)
  assert.equal(isPrivateIpv6('2001:4860:4860::8888'), false)
})

test('normalizeIpAddress strips ipv4-mapped ipv6 prefix', () => {
  assert.equal(normalizeIpAddress('::ffff:192.168.1.1'), '192.168.1.1')
})
