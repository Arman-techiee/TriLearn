const { createServiceResponder } = require('../utils/serviceResult')
const prisma = require('../utils/prisma')
const { createNotifications } = require('../utils/notifications')
const { inferRoutineLink } = require('../utils/notificationLinks')
const ensureCoordinatorDepartmentScope = async (context, result, departmentValue, message = 'You can only manage routines in your own department') => {
  if (context.user.role !== 'COORDINATOR') {
    return null
  }

  const coordinatorDepartments = [context.coordinator?.department].filter(Boolean)

  if (coordinatorDepartments.length === 0) {
    result.withStatus(403, { message: 'Coordinator department is not configured yet' })
    return null
  }

  if (departmentValue && !coordinatorDepartments.includes(departmentValue)) {
    result.withStatus(403, { message })
    return null
  }

  return coordinatorDepartments
}

const applySectionScope = (studentSection) => (
  studentSection
    ? [{ section: null }, { section: studentSection }]
    : undefined
)

const applyDepartmentScope = (studentDepartment) => (
  studentDepartment
    ? [{ department: null }, { department: '' }, { department: studentDepartment }]
    : [{ department: null }, { department: '' }]
)

const WORKSHOP_NOTE = 'Laptop is compulsory for workshop.'

const normalizeRoutineClassType = (classType) => (
  ['LECTURE', 'TUTORIAL', 'WORKSHOP'].includes(classType) ? classType : 'LECTURE'
)

const buildRoutineNote = ({ classType, note }) => {
  const normalizedNote = String(note || '').trim()
  if (normalizedNote) {
    return normalizedNote
  }

  return normalizeRoutineClassType(classType) === 'WORKSHOP' ? WORKSHOP_NOTE : null
}

const buildRoutineFilters = async (context) => {
  const { dayOfWeek, semester, department, section } = context.query
  const filters = {}

  if (dayOfWeek) filters.dayOfWeek = dayOfWeek
  if (semester) filters.semester = parseInt(semester, 10)
  if (department) filters.department = department
  if (section) filters.section = section

  if (context.user.role === 'INSTRUCTOR') {
    const instructor = await prisma.instructor.findUnique({
      where: { userId: context.user.id }
    })

    filters.instructorId = instructor?.id || '__no_routines__'
  }

  if (context.user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: context.user.id }
    })

    if (!student) {
      return { id: '__no_routines__' }
    }

    const studentFilters = { ...filters }
    delete studentFilters.department
    delete studentFilters.semester
    delete studentFilters.section

    return {
      AND: [
        studentFilters,
        { semester: student.semester },
        { OR: applyDepartmentScope(student.department) },
        ...(applySectionScope(student.section) ? [{ OR: applySectionScope(student.section) }] : [])
      ]
    }
  }

  if (context.user.role === 'COORDINATOR') {
    const coordinatorDepartments = [context.coordinator?.department].filter(Boolean)

    if (coordinatorDepartments.length === 0) {
      return { id: '__no_routines__' }
    }

    return {
      AND: [
        filters,
        {
          department: {
            in: coordinatorDepartments
          }
        }
      ]
    }
  }

  return filters
}

const getRoutineInclude = () => ({
  subject: {
    select: {
      id: true,
      name: true,
      code: true,
      semester: true,
      department: true
    }
  },
  instructor: {
    include: {
      user: {
        select: { name: true }
      }
    }
  }
})

const getRoutineNotificationRecipients = async ({ department, semester, section, instructorId }) => {
  const [students, instructor, coordinators] = await Promise.all([
    prisma.student.findMany({
      where: {
        semester,
        ...(department ? { department } : {}),
        ...(section ? { section } : {}),
        user: {
          isActive: true
        }
      },
      select: {
        userId: true
      }
    }),
    prisma.instructor.findUnique({
      where: { id: instructorId },
      select: { userId: true }
    }),
    department
      ? prisma.coordinator.findMany({
          where: {
            department,
            user: {
              isActive: true
            }
          },
          select: { userId: true }
        })
      : Promise.resolve([])
  ])

  return [
    ...students.map((student) => ({ userId: student.userId, role: 'STUDENT' })),
    ...coordinators.map((coordinator) => ({ userId: coordinator.userId, role: 'COORDINATOR' })),
    instructor?.userId ? { userId: instructor.userId, role: 'INSTRUCTOR' } : null
  ].filter(Boolean)
}

const getRoutineAudienceLabel = ({ department, semester, section }) => {
  const scope = section ? `Section ${section}` : 'All Sections'
  return `${department || 'General'} • Semester ${semester} • ${scope}`
}

const notifyRoutineCreated = async (routine) => {
  const recipients = await getRoutineNotificationRecipients({
    department: routine.department,
    semester: routine.semester,
    section: routine.section,
    instructorId: routine.instructorId
  })

  await notifyRoutineRecipients({
    recipients,
    routine,
    event: 'ROUTINE_CREATED',
    title: 'Subject added to routine',
    message: `${routine.subject?.name || 'A subject'} (${routine.subject?.code || 'N/A'}) ${routine.classType === 'WORKSHOP' ? 'workshop' : 'class'} was added on ${routine.dayOfWeek} ${routine.startTime}-${routine.endTime} for ${getRoutineAudienceLabel(routine)}.${routine.note ? ` ${routine.note}` : ''}`,
    dedupeKeyFactory: (userId) => `routine-created:${routine.combinedGroupId || routine.id}:${userId}`
  })
}

const notifyRoutineRecipients = async ({ recipients, routine, event, title, message, dedupeKeyFactory }) => {
  if (!recipients.length) {
    return { count: 0 }
  }

  const recipientsByLink = recipients.reduce((acc, recipient) => {
    const link = inferRoutineLink(recipient.role)
    if (!acc.has(link)) {
      acc.set(link, [])
    }
    acc.get(link).push(recipient.userId)
    return acc
  }, new Map())

  const results = await Promise.all([...recipientsByLink.entries()].map(([link, userIds]) => createNotifications({
    userIds,
    type: 'ROUTINE_UPDATED',
    title,
    message,
    link,
    metadata: {
      event,
      routineId: routine.id,
      subjectId: routine.subjectId,
      department: routine.department || null,
      semester: routine.semester,
      section: routine.section || null,
      dayOfWeek: routine.dayOfWeek,
      startTime: routine.startTime,
      endTime: routine.endTime,
      classType: routine.classType || 'LECTURE',
      note: routine.note || null
    },
    dedupeKeyFactory
  })))

  return {
    count: results.reduce((total, item) => total + (item?.count || 0), 0),
    results
  }
}

const notifyRoutineDeleted = async (routine) => {
  const recipients = await getRoutineNotificationRecipients({
    department: routine.department,
    semester: routine.semester,
    section: routine.section,
    instructorId: routine.instructorId
  })

  await notifyRoutineRecipients({
    recipients,
    routine,
    event: 'ROUTINE_DELETED',
    title: 'Subject removed from routine',
    message: `${routine.subject?.name || 'A subject'} (${routine.subject?.code || 'N/A'}) was removed from ${routine.dayOfWeek} ${routine.startTime}-${routine.endTime} for ${getRoutineAudienceLabel(routine)}.`,
    dedupeKeyFactory: (userId) => `routine-deleted:${routine.id}:${userId}`
  })
}

const notifyRoutineUpdated = async (routine) => {
  const recipients = await getRoutineNotificationRecipients({
    department: routine.department,
    semester: routine.semester,
    section: routine.section,
    instructorId: routine.instructorId
  })

  await notifyRoutineRecipients({
    recipients,
    routine,
    event: 'ROUTINE_UPDATED',
    title: 'Routine updated',
    message: `${routine.subject?.name || 'A subject'} (${routine.subject?.code || 'N/A'}) is now scheduled as ${String(routine.classType || 'LECTURE').toLowerCase()} on ${routine.dayOfWeek} ${routine.startTime}-${routine.endTime} for ${getRoutineAudienceLabel(routine)}.${routine.note ? ` ${routine.note}` : ''}`,
    dedupeKeyFactory: (userId) => `routine-updated:${routine.id}:${Date.now()}:${userId}`
  })
}

const validateRoutineAcademicScope = async ({ subjectId, instructorId, department, semester, context }) => {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
  if (!subject) return { error: { status: 404, message: 'Subject not found' } }

  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: {
      id: true,
      department: true,
      departmentMemberships: {
        include: {
          department: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })
  if (!instructor) return { error: { status: 404, message: 'Instructor not found' } }

  if (subject.semester !== semester) {
    return { error: { status: 400, message: 'Routine semester must match the selected subject semester.' } }
  }

  const normalizedDepartment = department || null
  const normalizedSubjectDepartment = subject.department || null

  if (context?.user?.role === 'COORDINATOR') {
    const coordinatorDepartments = [context.coordinator?.department].filter(Boolean)

    if (coordinatorDepartments.length === 0) {
      return { error: { status: 403, message: 'Coordinator department is not configured yet' } }
    }

    if (
      (normalizedDepartment && !coordinatorDepartments.includes(normalizedDepartment)) ||
      (normalizedSubjectDepartment && !coordinatorDepartments.includes(normalizedSubjectDepartment))
    ) {
      return { error: { status: 403, message: 'You can only manage routines in your own department' } }
    }
  }

  if (normalizedDepartment !== normalizedSubjectDepartment) {
    return { error: { status: 400, message: 'Routine department must match the selected subject department.' } }
  }

  return { subject, instructor }
}

const getOverlapFilter = ({ dayOfWeek, startTime, endTime, section, room, department, semester, instructorId, combinedGroupId, excludeId }) => {
  const overlapConditions = [
    { startTime: { lte: startTime }, endTime: { gt: startTime } },
    { startTime: { lt: endTime }, endTime: { gte: endTime } },
    { startTime: { gte: startTime }, endTime: { lte: endTime } }
  ]

  return {
    dayOfWeek,
    id: excludeId ? { not: excludeId } : undefined,
    OR: [
      room
        ? {
            room,
            combinedGroupId: combinedGroupId ? { not: combinedGroupId } : undefined,
            OR: overlapConditions
          }
        : null,
      {
        department: department || null,
        semester,
        section: section || null,
        OR: overlapConditions
      },
      {
        instructorId,
        combinedGroupId: combinedGroupId ? { not: combinedGroupId } : undefined,
        OR: overlapConditions
      }
    ].filter(Boolean)
  }
}

const respondToRoutineConflict = ({ result, conflict, room, instructorId }) => {
  if (room && conflict.room === room) {
    return result.withStatus(400, { message: `Room ${room} is already booked at this time.` })
  }

  if (conflict.instructorId === instructorId) {
    return result.withStatus(400, { message: 'This instructor already has a class at this time.' })
  }

  return result.withStatus(400, { message: 'This time slot is already taken for this semester and section.' })
}

/**
 * Handles create routine business logic.
 * @param {...any} args - Service arguments.
 * @returns {Promise<any>|any} Service result.
 */
const createRoutine = async (context, result = createServiceResponder()) => {
  try {
    const { subjectId, instructorId, department, semester, section, dayOfWeek, startTime, endTime, room, combinedGroupId, classType, note } = context.body
    const normalizedClassType = normalizeRoutineClassType(classType)

    const scope = await validateRoutineAcademicScope({ context, subjectId, instructorId, department, semester })
    if (scope.error) {
      return result.withStatus(scope.error.status, { message: scope.error.message })
    }

    const conflict = await prisma.routine.findFirst({
      where: getOverlapFilter({ dayOfWeek, startTime, endTime, section, room, department, semester, instructorId, combinedGroupId })
    })

    if (conflict) {
      return respondToRoutineConflict({ result, conflict, room, instructorId })
    }

    const routine = await prisma.routine.create({
      data: {
        subjectId,
        instructorId,
        department: department || null,
        semester,
        section: section || null,
        dayOfWeek,
        startTime,
        endTime,
        classType: normalizedClassType,
        note: buildRoutineNote({ classType: normalizedClassType, note }),
        room: room || null,
        combinedGroupId: combinedGroupId || null
      },
      include: getRoutineInclude()
    })

    result.withStatus(201, { message: 'Routine created successfully!', routine })

    void notifyRoutineCreated(routine).catch(() => null)
  } catch (error) {
    if (error?.code === 'P2002') {
      return result.withStatus(400, { message: 'This instructor already has a class at this time.' })
    }

    throw error
  }
}

/**
 * Handles get all routines business logic.
 * @param {...any} args - Service arguments.
 * @returns {Promise<any>|any} Service result.
 */
const getAllRoutines = async (context, result = createServiceResponder()) => {
    const filters = await buildRoutineFilters(context)

  const routines = await prisma.routine.findMany({
    where: filters,
    include: getRoutineInclude(),
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  })

  result.ok({ total: routines.length, routines })
}

/**
 * Handles get routine by id business logic.
 * @param {...any} args - Service arguments.
 * @returns {Promise<any>|any} Service result.
 */
const getRoutineById = async (context, result = createServiceResponder()) => {
    const { id } = context.params
  const routine = await prisma.routine.findUnique({
    where: { id },
    include: getRoutineInclude()
  })
  if (!routine) return result.withStatus(404, { message: 'Routine not found' })

  const departmentAllowed = await ensureCoordinatorDepartmentScope(context, result, routine.department)
  if (context.user.role === 'COORDINATOR' && !departmentAllowed) {
    return
  }

  result.ok({ routine })
}

/**
 * Handles update routine business logic.
 * @param {...any} args - Service arguments.
 * @returns {Promise<any>|any} Service result.
 */
const updateRoutine = async (context, result = createServiceResponder()) => {
  try {
    const { id } = context.params
    const { subjectId, instructorId, department, semester, section, dayOfWeek, startTime, endTime, room, combinedGroupId, classType, note } = context.body
    const normalizedClassType = normalizeRoutineClassType(classType)

    const routine = await prisma.routine.findUnique({
      where: { id },
      include: getRoutineInclude()
    })
    if (!routine) return result.withStatus(404, { message: 'Routine not found' })

    const departmentAllowed = await ensureCoordinatorDepartmentScope(context, result, routine.department)
    if (context.user.role === 'COORDINATOR' && !departmentAllowed) {
      return
    }

    const scope = await validateRoutineAcademicScope({ context, subjectId, instructorId, department, semester })
    if (scope.error) {
      return result.withStatus(scope.error.status, { message: scope.error.message })
    }

    const conflict = await prisma.routine.findFirst({
      where: getOverlapFilter({ dayOfWeek, startTime, endTime, section, room, department, semester, instructorId, combinedGroupId, excludeId: id })
    })

    if (conflict) {
      return respondToRoutineConflict({ result, conflict, room, instructorId })
    }

    const updated = await prisma.routine.update({
      where: { id },
      data: {
        subjectId,
        instructorId,
        department: department || null,
        semester,
        section: section || null,
        dayOfWeek,
        startTime,
        endTime,
        classType: normalizedClassType,
        note: buildRoutineNote({ classType: normalizedClassType, note }),
        room: room || null,
        combinedGroupId: combinedGroupId || null
      },
      include: getRoutineInclude()
    })

    result.ok({ message: 'Routine updated successfully!', routine: updated })

    if (routine.subjectId !== updated.subjectId) {
      void Promise.allSettled([
        notifyRoutineDeleted(routine),
        notifyRoutineCreated(updated)
      ])
    } else {
      void notifyRoutineUpdated(updated).catch(() => null)
    }
  } catch (error) {
    if (error?.code === 'P2002') {
      return result.withStatus(400, { message: 'This instructor already has a class at this time.' })
    }

    throw error
  }
}

/**
 * Handles delete routine business logic.
 * @param {...any} args - Service arguments.
 * @returns {Promise<any>|any} Service result.
 */
const deleteRoutine = async (context, result = createServiceResponder()) => {
    const { id } = context.params
  const routine = await prisma.routine.findUnique({
    where: { id },
    include: getRoutineInclude()
  })
  if (!routine) return result.withStatus(404, { message: 'Routine not found' })

  const departmentAllowed = await ensureCoordinatorDepartmentScope(context, result, routine.department)
  if (context.user.role === 'COORDINATOR' && !departmentAllowed) {
    return
  }

  await prisma.routine.delete({ where: { id } })
  result.ok({ message: 'Routine deleted successfully!' })

  void notifyRoutineDeleted(routine).catch(() => null)
}

module.exports = { createRoutine, getAllRoutines, getRoutineById, updateRoutine, deleteRoutine }
