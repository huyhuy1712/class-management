export const examStatuses = {
  DONE: { label: 'Đã làm', tone: 'bg-emerald-50 text-emerald-700' },
  TODO: { label: 'Chưa làm', tone: 'bg-slate-100 text-slate-600' },
  PENDING: { label: 'Chờ chấm', tone: 'bg-amber-50 text-amber-700' },
}

export function getExamStatus(item) {
  if (item.attemptStatus === 'GRADED') return 'DONE'
  if (item.attemptStatus === 'SUBMITTED') return 'PENDING'
  return 'TODO'
}

function normalizeSearch(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi').replace(/đ/g, 'd').trim().replace(/\s+/g, ' ')
}

function dateTimestamp(value) {
  if (!value) return null
  const text = String(value)
  const timestamp = Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/.test(text) ? text : `${text.length === 10 ? `${text}T00:00:00` : text}+07:00`)
  return Number.isFinite(timestamp) ? timestamp : null
}

export function getExamAssignmentDate(value) {
  const timestamp = dateTimestamp(value)
  if (timestamp === null) return ''
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(timestamp)
  const part = (type) => parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function filterStudentExams(items, filters) {
  const keywords = normalizeSearch(filters.search).split(' ').filter(Boolean)
  return items.filter((item) => {
    const text = normalizeSearch(`${item.title ?? ''} ${item.code ?? ''}`)
    return keywords.every((keyword) => text.includes(keyword))
      && (!filters.classId || item.classes?.some((group) => String(group.id) === String(filters.classId)))
      && (!filters.date || getExamAssignmentDate(item.createdAt) === filters.date)
  }).sort((a, b) => {
    const left = dateTimestamp(a.createdAt)
    const right = dateTimestamp(b.createdAt)
    if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1
    const difference = left - right
    return filters.order === 'OLDEST' ? difference : -difference
  })
}
