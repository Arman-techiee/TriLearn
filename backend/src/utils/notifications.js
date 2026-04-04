const prisma = require('./prisma')

const uniqueUserIds = (userIds = []) => [...new Set(userIds.filter(Boolean))]

const loadPushTargets = async (userIds = []) => {
  const recipients = uniqueUserIds(userIds)

  if (!recipients.length || !prisma.deviceToken?.findMany) {
    return []
  }

  return prisma.deviceToken.findMany({
    where: {
      userId: { in: recipients }
    },
    select: {
      userId: true,
      token: true,
      platform: true
    }
  })
}

const dispatchPushNotifications = async ({ userIds }) => {
  // Mobile groundwork: persist device tokens now and centralize the future
  // FCM fan-out hook here after database notifications are saved.
  const pushTargets = await loadPushTargets(userIds)
  return { count: pushTargets.length }
}

const createNotification = async ({
  userId,
  type,
  title,
  message,
  link = null,
  metadata = null,
  dedupeKey = null
}) => {
  if (!userId) {
    return null
  }

  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
      metadata,
      dedupeKey
    }
  }).catch((error) => {
    if (error?.code === 'P2002' && dedupeKey) {
      return null
    }

    throw error
  }).then(async (notification) => {
    if (notification) {
      await dispatchPushNotifications({ userIds: [userId] })
    }

    return notification
  })
}

const createNotifications = async ({
  userIds,
  type,
  title,
  message,
  link = null,
  metadata = null,
  dedupeKeyFactory = null
}) => {
  const recipients = uniqueUserIds(userIds)

  if (!recipients.length) {
    return { count: 0 }
  }

  const result = await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      type,
      title,
      message,
      link,
      metadata,
      dedupeKey: typeof dedupeKeyFactory === 'function' ? dedupeKeyFactory(userId) : null
    })),
    skipDuplicates: true
  })

  await dispatchPushNotifications({ userIds: recipients })
  return result
}

module.exports = {
  createNotification,
  createNotifications
}
