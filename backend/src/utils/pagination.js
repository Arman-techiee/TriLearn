const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20))
  if (query.cursor) {
    return { cursor: query.cursor, take: limit }
  }

  const skip = (page - 1) * limit

  return { page, limit, skip }
}

const buildCursorMeta = (items, take) => ({
  nextCursor: items[items.length - 1]?.id ?? null,
  hasMore: items.length === take
})

module.exports = { getPagination, buildCursorMeta }
