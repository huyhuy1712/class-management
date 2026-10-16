import { getGroupScore } from './examScoreUtils.js'
import { MAX_EXAM_POINT, SCORE_SCALE } from './examScoreConstants.js'

export const isExamPoint = (value) => /^\d+(\.\d{1,3})?$/.test(String(value ?? '')) && Number(value) <= MAX_EXAM_POINT
export const pointUnits = (value) => Math.round(Number(value) * SCORE_SCALE)

export function validateGroupScore(group) {
  const score = getGroupScore(group)
  if (!isExamPoint(score)) return 'Điểm nhóm phải từ 0 đến 9999.999 và có tối đa 3 chữ số thập phân.'
  if (group.answerType !== 'TRUE_FALSE') {
    const items = group.answerType === 'CHOICE' ? group.answers.filter((item) => item.isCorrect === true) : group.answers
    return items.some((item) => !isExamPoint(item.point)) ? 'Điểm đáp án phải từ 0 đến 9999.999 và có tối đa 3 chữ số thập phân.' : null
  }
  if (!group.scoreByCorrectCount) {
    if (group.answers.some((item) => !isExamPoint(item.point))) return 'Điểm từng ý phải từ 0 đến 9999.999 và có tối đa 3 chữ số thập phân.'
    return null
  }
  const rules = group.scoringRules ?? []
  const count = group.answers.length
  const scores = new Map()
  for (const rule of rules) {
    if (String(rule.correctCount).trim() === '' || !Number.isInteger(Number(rule.correctCount)) || Number(rule.correctCount) < 0 || Number(rule.correctCount) > count) return 'Số ý đúng phải là số nguyên từ 0 đến số ý của nhóm.'
    const correctCount = Number(rule.correctCount)
    if (scores.has(correctCount)) return 'Không được có hai quy luật cùng số ý đúng.'
    if (!isExamPoint(rule.point)) return 'Điểm quy luật phải từ 0 đến 9999.999, tối đa 3 chữ số thập phân.'
    scores.set(correctCount, pointUnits(rule.point))
  }
  if (scores.size !== count + 1) return `Cần đủ quy luật cho số ý đúng từ 0 đến ${count}.`
  let previous = 0
  for (let index = 0; index <= count; index++) {
    const score = scores.get(index)
    if (score === undefined || (index === 0 && score !== 0) || score < previous) return 'Điểm quy luật phải tăng không giảm; 0 ý đúng nhận 0 điểm.'
    previous = score
  }
  if (previous !== pointUnits(score)) return 'Điểm khi đúng toàn bộ ý phải bằng điểm nhóm.'
  return null
}
