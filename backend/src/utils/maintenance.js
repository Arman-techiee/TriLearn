const logger = require('./logger')

const DEFAULT_REFRESH_TOKEN_CLEANUP_INTERVAL_MS = 60 * 60 * 1000
const DEFAULT_AUDIT_LOG_RETENTION_DAYS = 180
const DEFAULT_AUDIT_LOG_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const getAuditLogCutoff = () => {
  const retentionDays = parsePositiveInteger(process.env.AUDIT_LOG_RETENTION_DAYS, DEFAULT_AUDIT_LOG_RETENTION_DAYS)
  return new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000))
}

const runRefreshTokenCleanup = async (prisma) => {
  const now = new Date()
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { revokedAt: { lt: now } }
      ]
    }
  })

  if (result.count > 0) {
    logger.info('Expired refresh tokens cleaned up', { deletedCount: result.count })
  }
}

const runAuditLogCleanup = async (prisma) => {
  const cutoff = getAuditLogCutoff()
  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoff }
    }
  })

  if (result.count > 0) {
    logger.info('Expired audit logs cleaned up', {
      deletedCount: result.count,
      retentionDays: parsePositiveInteger(process.env.AUDIT_LOG_RETENTION_DAYS, DEFAULT_AUDIT_LOG_RETENTION_DAYS)
    })
  }
}

const scheduleMaintenance = (prisma) => {
  const refreshTokenCleanupInterval = parsePositiveInteger(
    process.env.REFRESH_TOKEN_CLEANUP_INTERVAL_MS,
    DEFAULT_REFRESH_TOKEN_CLEANUP_INTERVAL_MS
  )
  const auditLogCleanupInterval = parsePositiveInteger(
    process.env.AUDIT_LOG_CLEANUP_INTERVAL_MS,
    DEFAULT_AUDIT_LOG_CLEANUP_INTERVAL_MS
  )

  const safeRun = (taskName, task) => async () => {
    try {
      await task(prisma)
    } catch (error) {
      logger.error(`Maintenance task failed: ${taskName}`, { message: error.message, stack: error.stack })
    }
  }

  const refreshTokenTask = safeRun('refresh-token-cleanup', runRefreshTokenCleanup)
  const auditLogTask = safeRun('audit-log-cleanup', runAuditLogCleanup)

  void refreshTokenTask()
  void auditLogTask()

  const refreshTokenTimer = setInterval(() => {
    void refreshTokenTask()
  }, refreshTokenCleanupInterval)
  refreshTokenTimer.unref?.()

  const auditLogTimer = setInterval(() => {
    void auditLogTask()
  }, auditLogCleanupInterval)
  auditLogTimer.unref?.()

  return {
    stop: () => {
      clearInterval(refreshTokenTimer)
      clearInterval(auditLogTimer)
    }
  }
}

module.exports = {
  scheduleMaintenance
}
