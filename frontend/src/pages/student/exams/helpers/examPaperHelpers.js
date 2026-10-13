export function isQuestionAnswered(question, value) {
  if (question.type === 'TRUE_FALSE') return question.statements.every((_, index) => typeof value?.[index] === 'boolean')
  if (question.type === 'MULTIPLE') return Array.isArray(value) && value.length > 0
  if (question.type === 'SINGLE') return Number.isInteger(value)
  return typeof value === 'string' && value.trim().length > 0
}

export function formatRemainingTime(seconds) {
  const value = Math.max(0, seconds)
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}
