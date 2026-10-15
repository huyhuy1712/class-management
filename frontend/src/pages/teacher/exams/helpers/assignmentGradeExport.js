import { attemptLabels } from './assignmentAttemptHelpers.js'

const round = (value) => Number(value.toFixed(3))
export function buildAssignmentGradeExport(items, maxScore) {
  const maximum = Number(maxScore)
  if (!(maximum > 0)) throw new Error('Chưa có tổng điểm hợp lệ để xuất bảng điểm.')
  const rows = items.map((item) => {
    const score = item.status === 'NOT_STARTED' ? 0 : item.totalScore == null ? null : Number(item.totalScore)
    const onTen = score == null ? null : round(score / maximum * 10)
    const final = item.status === 'GRADED' || item.status === 'NOT_STARTED'
    return { ...item, score, onTen, final }
  }).sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity) || String(a.fullName).localeCompare(String(b.fullName), 'vi'))
  const values = rows.filter((item) => item.final && item.onTen != null).map((item) => item.onTen)
  const frequencies = new Map()
  values.forEach((score) => frequencies.set(score, (frequencies.get(score) ?? 0) + 1))
  const frequency = Math.max(0, ...frequencies.values())
  const modes = frequency > 1 ? [...frequencies].filter(([, count]) => count === frequency).map(([score]) => score).sort((a, b) => a - b) : []
  return { rows, summary: { count: values.length, average: values.length ? round(values.reduce((sum, score) => sum + score, 0) / values.length) : null,
    modes, excellent: values.filter((v) => v >= 8).length, good: values.filter((v) => v >= 6.5 && v < 8).length,
    averageCount: values.filter((v) => v >= 5 && v < 6.5).length, weak: values.filter((v) => v < 5).length,
    pending: rows.filter((item) => !item.final).length } }
}

// Quote every cell and neutralize formula prefixes before Excel opens user-entered text.
const cell = (value) => {
  const text = String(value ?? '')
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}
export function assignmentGradeCsv(report, title, assignmentId, maxScore) {
  const s = report.summary
  const lines = [
    ['BẢNG ĐIỂM', title], ['Đợt giao', assignmentId], ['Tổng điểm đề', maxScore],
    ['Quy tắc', 'Chưa làm = 0. Điểm thống kê quy đổi thang 10. Bài đang làm/chờ chấm không tính thống kê; điểm nếu có là tạm tính.'],
    ['Điểm trung bình /10', s.average ?? '—'], ['Mốt /10', s.modes.length ? s.modes.join('; ') : 'Không có mốt'],
    ['Giỏi (>=8)', s.excellent], ['Khá (6,5 đến dưới 8)', s.good], ['Trung bình (5 đến dưới 6,5)', s.averageCount],
    ['Yếu (dưới 5)', s.weak], ['Số HS tính thống kê', s.count], ['Đang làm/chờ chấm', s.pending], [],
    ['STT', 'Mã học sinh', 'Họ tên', 'Lượt', 'Trạng thái', 'Điểm', 'Tổng điểm', 'Điểm /10', 'Ghi chú'],
    ...report.rows.map((item, index) => [index + 1, item.studentCode, item.fullName, item.attemptNumber ?? 0,
      attemptLabels[item.status] ?? item.status, item.score, maxScore, item.onTen,
      item.status === 'NOT_STARTED' ? 'Chưa làm, tính 0' : item.final ? '' : 'Điểm tạm tính, chưa tính thống kê']),
  ]
  return '\uFEFF' + lines.map((row) => row.map(cell).join(',')).join('\r\n')
}
