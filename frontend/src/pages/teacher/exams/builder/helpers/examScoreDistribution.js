const units = (value) => Math.max(0, Math.round((Number(value) || 0) * 100))

const scoredItems = (group) => group.answerType === 'CHOICE'
  ? group.answers.filter((item) => item.isCorrect === true)
  : group.answers

export const canDistributeQuestionScore = (question) => question.answerGroups.some((group) =>
  group.answerType && (group.answerType === 'TRUE_FALSE' && group.scoreByCorrectCount
    ? (group.scoringRules ?? []).some((rule) => Number(rule.correctCount) === group.answers.length && group.answers.length > 0)
    : scoredItems(group).length > 0),
)

function distribute(total, weights) {
  const sum = weights.reduce((result, weight) => result + weight, 0)
  const shares = weights.map((weight) => total * (sum ? weight / sum : 1 / weights.length))
  const result = shares.map(Math.floor)
  const remainder = total - result.reduce((sum, value) => sum + value, 0)
  const order = shares.map((share, index) => ({ index, fraction: share - result[index] }))
    .sort((a, b) => b.fraction - a.fraction)
  for (let index = 0; index < remainder; index++) result[order[index].index]++
  return result
}

export function distributeQuestionScore(question, value) {
  const targets = question.answerGroups.flatMap((group, groupIndex) => {
    if (!group.answerType) return []
    if (group.answerType === 'TRUE_FALSE' && group.scoreByCorrectCount) {
      const rule = (group.scoringRules ?? []).find((item) => Number(item.correctCount) === group.answers.length)
      return rule && group.answers.length ? [{ groupIndex, rule, weight: units(rule.point) }] : []
    }
    return scoredItems(group).map((item) => ({ groupIndex, item, weight: units(item.point) }))
  })
  if (!targets.length) return question
  const scores = distribute(units(value), targets.map((target) => target.weight))
  return {
    ...question,
    answerGroups: question.answerGroups.map((group, groupIndex) => {
      const ruleIndex = targets.findIndex((target) => target.groupIndex === groupIndex && target.rule)
      if (ruleIndex >= 0) {
        const maximum = scores[ruleIndex]
        const oldMaximum = targets[ruleIndex].weight
        return {
          ...group,
          scoringRules: group.scoringRules.map((rule) => ({
            ...rule,
            point: Number(rule.correctCount) === group.answers.length ? maximum / 100
              : (oldMaximum ? Math.min(maximum, Math.round(units(rule.point) * maximum / oldMaximum)) : 0) / 100,
          })),
        }
      }
      return {
        ...group,
        answers: group.answers.map((item) => {
          const index = targets.findIndex((target) => target.groupIndex === groupIndex && target.item === item)
          return index < 0 ? item : { ...item, point: scores[index] / 100 }
        }),
      }
    }),
  }
}
