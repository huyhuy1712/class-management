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

export function getReviewStatus(question, value, review) {
  const hasAnswer = question.type === 'TRUE_FALSE' ? Object.values(value ?? {}).some((item) => typeof item === 'boolean') : isQuestionAnswered(question, value)
  if (!hasAnswer) return 'EMPTY'
  if (review?.correct === true) return 'CORRECT'
  if (review?.correct === false) return 'WRONG'
  return 'PENDING'
}
