const units = (value) => Math.round((Number(value) || 0) * 100)

export function getGroupScore(group) {
  if (group.answerType === 'TRUE_FALSE' && group.scoreByCorrectCount) {
    const rule = (group.scoringRules ?? []).find((item) => Number(item.correctCount) === group.answers.length)
    return units(rule?.point) / 100
  }
  const items = group.answerType === 'CHOICE'
    ? group.answers.filter((item) => item.isCorrect === true)
    : group.answers
  return items.reduce((total, item) => total + units(item.point), 0) / 100
}

export const getQuestionScore = (question) =>
  (question.answerGroups ?? []).reduce((total, group) => total + units(getGroupScore(group)), 0) / 100

export function migrateDraftScores(sections) {
  return sections.map((section) => ({
    ...section,
    questions: section.questions.map((question) => ({
      ...question,
      answerGroups: question.answerGroups.map((group) => {
        const { point: oldPoint, ...stored } = group
        const rest = { ...stored, choiceMode: group.choiceMode ?? (group.answers.filter((item) => item.isCorrect).length > 1 ? 'MULTIPLE' : 'SINGLE') }
        if (group.answerType === 'TRUE_FALSE' || !Number(oldPoint)) return rest
        const scored = group.answers.filter((item) => group.answerType !== 'CHOICE' || item.isCorrect === true)
        if (!scored.length || scored.some((item) => Number(item.point))) return rest
        const total = units(oldPoint)
        const share = Math.floor(total / scored.length)
        return {
          ...rest,
          answers: group.answers.map((item) => {
            const index = scored.indexOf(item)
            return index < 0 ? item : { ...item, point: (share + (index === scored.length - 1 ? total % scored.length : 0)) / 100 }
          }),
        }
      }),
    })),
  }))
}

export const getSectionScore = (section) =>
  Number(section.questions.reduce((total, question) => total + getQuestionScore(question), 0).toFixed(2))

export const getExamScore = (sections) =>
  Number(sections.reduce((total, section) => total + getSectionScore(section), 0).toFixed(2))
