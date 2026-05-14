const inferNoticeLink = (role) => (
  role === 'STUDENT'
    ? '/student/notices'
    : role === 'INSTRUCTOR'
      ? '/instructor/notices'
      : role === 'COORDINATOR'
        ? '/coordinator/notices'
        : '/admin/notices'
)

const inferRoutineLink = (role) => (
  role === 'STUDENT'
    ? '/student/routine'
    : role === 'INSTRUCTOR'
      ? '/instructor/routine'
      : role === 'COORDINATOR'
        ? '/coordinator/routine'
        : '/admin/routine'
)

module.exports = {
  inferNoticeLink,
  inferRoutineLink
}
