const scores = [4.5, 6, 6.5, 7.5, 8, 7, 8.5, 7.5, 9, 8, 9.5, 7.5]
export const demoGradeAttempts = [...scores, null, null].map((score, index) => ({
  id: index + 1, assignmentId: Math.floor(index / 2) + 1, attemptNumber: index % 2 + 1,
  title: `${Math.floor(index / 2) % 2 ? 'Kiểm tra chương' : 'Ôn tập tổng hợp'} ${Math.floor(index / 2) + 1}`,
  code: `EX-DEMO-${String(Math.floor(index / 2) + 1).padStart(3, '0')}`,
  subject: Math.floor(index / 2) % 3 === 0 ? 'Tiếng Anh' : 'Toán', classroom: Math.floor(index / 2) % 3 === 0 ? 'Lớp Anh 12A5' : 'Lớp Toán 12A1',
  date: `2026-${index < 4 ? '09' : '10'}-${String(index < 4 ? 20 + index * 2 : index).padStart(2, '0')}`,
  score, maxScore: 10, status: score == null ? 'SUBMITTED' : 'GRADED',
  minutes: 35 + index * 2, comment: score == null ? '' : score >= 8 ? 'Bài làm tốt, tiếp tục phát huy nhé!' : 'Ôn lại những câu chưa chắc chắn để cải thiện kết quả.',
}))

export function summarizeGradeAttempts(items) {
  const graded = items.filter((item) => item.status === 'GRADED' && item.score != null)
  const values = graded.map((item) => Number((item.score / item.maxScore * 10).toFixed(2)))
  const frequencies = new Map()
  values.forEach((score) => frequencies.set(score, (frequencies.get(score) ?? 0) + 1))
  const maxFrequency = Math.max(0, ...frequencies.values())
  return {
    graded, values, average: values.length ? values.reduce((sum, score) => sum + score, 0) / values.length : null,
    lowest: values.length ? Math.min(...values) : null, highest: values.length ? Math.max(...values) : null,
    modes: maxFrequency > 1 ? [...frequencies].filter(([, count]) => count === maxFrequency).map(([score]) => score).sort((a, b) => a - b) : [],
    passed: values.filter((score) => score >= 5).length,
    pending: items.filter((item) => item.status === 'SUBMITTED').length,
    bands: [values.filter((score) => score < 5).length, values.filter((score) => score >= 5 && score < 6.5).length,
      values.filter((score) => score >= 6.5 && score < 8).length, values.filter((score) => score >= 8).length],
  }
}
