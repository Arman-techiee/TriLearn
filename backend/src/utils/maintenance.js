const logger = require('./logger')
const { startTokenCleanupJob } = require('../jobs/cleanupTokens')
const { createNotifications } = require('./notifications')
const { syncClosedRoutineAbsences } = require('../controllers/attendance/shared')

const DEFAULT_AUDIT_LOG_RETENTION_DAYS = 180
const DEFAULT_AUDIT_LOG_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000
const DEFAULT_ATTENDANCE_SYNC_INTERVAL_MS = 5 * 60 * 1000

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const getAuditLogCutoff = () => {
  const retentionDays = parsePositiveInteger(process.env.AUDIT_LOG_RETENTION_DAYS, DEFAULT_AUDIT_LOG_RETENTION_DAYS)
  return new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000))
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

const runAssignmentDueNotifications = async (prisma) => {
  const now = new Date()
  const nextDay = new Date(now.getTime() + (24 * 60 * 60 * 1000))

  const assignments = await prisma.assignment.findMany({
    where: {
      dueDate: {
        gt: now,
        lte: nextDay
      }
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          enrollments: {
            select: {
              student: {
                select: {
                  userId: true
                }
              }
            }
          }
        }
      }
    }
  })

  for (const assignment of assignments) {
    const dueLabel = assignment.dueDate.toISOString().slice(0, 10)

    await createNotifications({
      userIds: assignment.subject.enrollments.map((enrollment) => enrollment.student.userId),
      type: 'ASSIGNMENT_DUE',
      title: `Assignment due soon: ${assignment.title}`,
      message: `${assignment.subject.name} (${assignment.subject.code}) is due by ${assignment.dueDate.toLocaleString()}.`,
      link: '/student/assignments',
      metadata: {
        assignmentId: assignment.id,
        subjectId: assignment.subject.id,
        dueDate: assignment.dueDate.toISOString()
      },
      dedupeKeyFactory: (userId) => `assignment-due:${assignment.id}:${userId}:${dueLabel}`
    })
  }
}

const runClosedRoutineAbsenceSync = async () => {
  await syncClosedRoutineAbsences(new Date())
}

const scheduleMaintenance = (prisma) => {
  const auditLogCleanupInterval = parsePositiveInteger(
    process.env.AUDIT_LOG_CLEANUP_INTERVAL_MS,
    DEFAULT_AUDIT_LOG_CLEANUP_INTERVAL_MS
  )
  const attendanceSyncInterval = parsePositiveInteger(
    process.env.ATTENDANCE_SYNC_INTERVAL_MS,
    DEFAULT_ATTENDANCE_SYNC_INTERVAL_MS
  )

  const createScheduledTask = (taskName, task) => {
    let running = false

    return async () => {
      if (running) {
        logger.warn(`Skipping overlapping maintenance task: ${taskName}`)
        return
      }

      running = true

      try {
        await task(prisma)
      } catch (error) {
        logger.error(`Maintenance task failed: ${taskName}`, { message: error.message, stack: error.stack })
      } finally {
        running = false
      }
    }
  }

  const auditLogTask = createScheduledTask('audit-log-cleanup', runAuditLogCleanup)
  const assignmentDueNotificationTask = createScheduledTask('assignment-due-notifications', runAssignmentDueNotifications)
  const closedRoutineAbsenceSyncTask = createScheduledTask('closed-routine-absence-sync', runClosedRoutineAbsenceSync)
  void auditLogTask()
  void assignmentDueNotificationTask()
  void closedRoutineAbsenceSyncTask()

  const tokenCleanupJob = startTokenCleanupJob(prisma)

  const auditLogTimer = setInterval(() => {
    void auditLogTask()
    void assignmentDueNotificationTask()
  }, auditLogCleanupInterval)
  auditLogTimer.unref?.()

  const attendanceSyncTimer = setInterval(() => {
    void closedRoutineAbsenceSyncTask()
  }, attendanceSyncInterval)
  attendanceSyncTimer.unref?.()

  return {
    stop: () => {
      tokenCleanupJob.stop()
      clearInterval(auditLogTimer)
      clearInterval(attendanceSyncTimer)
    }
  }
}

module.exports = {
  scheduleMaintenance
}
