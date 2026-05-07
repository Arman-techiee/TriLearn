const logger = require('./logger')
const prisma = require('./prisma')

/**
 * @typedef {Object} AuditMetadata
 * @property {string} [ipAddress]
 * @property {string} [userAgent]
 * @property {string} [sessionId]
 * @property {string} [targetUserId]
 * @property {Record<string, unknown>} [extra]
 */
const recordAuditLog = async ({
  actorId,
  actorRole,
  action,
  entityType,
  entityId = null,
  metadata = null,
  db = prisma
}) => {
  try {
    if (!actorId) {
      logger.warn('Skipping audit log without actorId', { action, entityType, entityId })
      return null
    }

    const normalizedMetadata = metadata == null || (typeof metadata === 'object' && !Array.isArray(metadata))
      ? metadata
      : null

    if (metadata !== normalizedMetadata) {
      logger.warn('Ignoring invalid audit log metadata payload')
    }

    await db.auditLog.create({
      data: {
        actorId,
        actorRole: actorRole || null,
        action,
        entityType,
        entityId,
        metadata: normalizedMetadata
      }
    })
  } catch (error) {
    logger.error(error.message, { stack: error.stack })
  }
}

module.exports = { recordAuditLog }
