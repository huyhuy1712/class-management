const assignmentFields = {
  openTime: 'openTime', closeTime: 'closeTime', scoreVisibility: 'scoreVisibility',
  answerVisibility: 'answerVisibility', hideCorrectAnswerOnWrong: 'hideWrongAnswers',
  assignmentType: 'accessType', classIds: 'accessType', studentIds: 'accessType', id: 'accessType',
}
const basicFields = new Set(['title', 'subjectId', 'gradeLevel', 'purpose', 'description', 'timeLimit', 'maxAttempts'])
export function mapConfigurationErrors(validationErrors = {}) {
  const errors = {}
  for (const [path, message] of Object.entries(validationErrors)) {
    const field = path.replace(/^basicInfo\./, '').split(/[.[]/)[0]
    const key = path.startsWith('assignment.') ? assignmentFields[path.split('.')[1]?.split('[')[0]] : basicFields.has(field) ? field : undefined
    if (key) errors[key] = message
  }
  return errors
}
export function focusConfigurationError(root, errors) {
  requestAnimationFrame(() => {
    const first = Object.keys(errors)[0]
    const field = [...(root?.querySelectorAll('[name]') ?? [])].find((element) => element.name === first)
    const target = field ?? (first === 'accessType' ? root?.querySelector('#exam-access') : null)
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    ;(field ?? target?.querySelector('button, input'))?.focus({ preventScroll: true })
  })
}
