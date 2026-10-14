export const attemptLabels = { NOT_STARTED: 'Chưa làm', IN_PROGRESS: 'Đang làm', SUBMITTED: 'Chờ chấm tự luận', GRADED: 'Đã chấm' }
export const canComment = (item) => item?.attemptId != null && ['SUBMITTED', 'GRADED'].includes(item.status)
export function patchAttemptPage(page, id, patch) {
  return page ? { ...page, items: page.items.map((item) => item.attemptId === id ? { ...item, ...patch } : item) } : page
}
export function rollbackAttemptComment(page, id, optimistic, previous) {
  return page ? { ...page, items: page.items.map((item) => item.attemptId === id && item.teacherComment === optimistic
    ? { ...item, teacherComment: previous } : item) } : page
}
export function attemptDuration(seconds) {
  if (seconds == null) return '—'
  const value = Math.max(0, seconds)
  return `${Math.floor(value / 60)} phút ${value % 60} giây`
}
