const SUBMITTED_STATUSES = new Set(['SUBMITTED', 'GRADED'])

export function filterStudentHomeworks(homeworks, filter, now = Date.now()) {
  if (filter === 'ALL') return homeworks

  return homeworks.filter(({ assignment, submissionStatus }) => {
    const needsWork = !SUBMITTED_STATUSES.has(submissionStatus)
    const overdue = submissionStatus === 'NOT_SUBMITTED'
      && assignment.dueAt
      && new Date(assignment.dueAt).getTime() <= now

    if (filter === 'OVERDUE') return Boolean(overdue)
    if (filter === 'NOT_DONE') return needsWork && !overdue
    if (filter === 'SUBMITTED') return SUBMITTED_STATUSES.has(submissionStatus)
    return false
  })
}
