export function mapExamApiErrors(fieldErrors = {}, sections = []) {
  const errors = {}
  const configErrors = {}
  for (const [path, message] of Object.entries(fieldErrors)) {
    if (path.startsWith('basicInfo.') || path.startsWith('assignment')) {
      const assignmentFields = { openTime: 'openTime', closeTime: 'closeTime', scoreVisibility: 'scoreVisibility', answerVisibility: 'answerVisibility', hideCorrectAnswerOnWrong: 'hideWrongAnswers' }
      const key = path.startsWith('basicInfo.') ? path.slice(10) : assignmentFields[path.split('.')[1]] ?? 'accessType'
      configErrors[key] = message
      continue
    }
    const indexes = [...path.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1]))
    const section = sections[indexes[0]]
    const question = section?.questions[indexes[1]]
    const group = question?.answerGroups[indexes[2]]
    const id = group ? `answer-group-${group.id}` : question ? `question-${question.id}` : section ? `section-${section.id}` : 'builder-root'
    errors[id] = errors[id] ? `${errors[id]} ${message}` : message
  }
  return { errors, configErrors }
}

export function focusExamError(id) {
  requestAnimationFrame(() => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element?.querySelector('input, textarea, button, math-field')?.focus()
  })
}

export function isUncertainExamSave(error, requestStarted) {
  const status = error.response?.status
  return requestStarted && (!status || status >= 500 || status === 408)
}
