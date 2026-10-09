import { getExamConfigurationForm } from './examConfigurationForm.js'
const ordered = (items = []) => [...items].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

function toGroup(answer) {
  const choice = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(answer.answerType)
  const type = choice ? 'CHOICE' : answer.answerType === 'ESSAY' ? 'TEXT' : answer.answerType
  const options = ordered(answer.options)
  const correct = options.filter((option) => option.isCorrect)
  const correctCount = correct.length
  const cents = Math.round(Number(answer.points ?? 0) * 100)
  return {
    ...answer, answerType: type, choiceMode: answer.answerType === 'MULTIPLE_CHOICE' ? 'MULTIPLE' : 'SINGLE',
    scoreByCorrectCount: answer.scoringType === 'CORRECT_COUNT',
    scoringRules: (answer.scoringRules ?? []).map((rule) => ({ ...rule, point: rule.score })),
    answers: choice || type === 'TRUE_FALSE' ? options.map((option) => ({
      ...option, answerType: type,
      point: choice ? (option.isCorrect && correctCount ? (Math.floor(cents / correctCount) + (correct.indexOf(option) === correctCount - 1 ? cents % correctCount : 0)) / 100 : 0) : option.points ?? 0,
    })) : [{ ...answer, id: `answer-${answer.id}`, answerType: type, content: type === 'SHORT_ANSWER' ? answer.correctAnswerText ?? '' : answer.content ?? '', point: answer.points ?? 0 }],
  }
}
export function toExamBuilder(detail) {
  return {
    ...getExamConfigurationForm(detail),
    sections: ordered(detail.sections).map((section) => ({
      ...section,
      questions: ordered(section.questions).map((question) => ({
        ...question, point: question.points ?? 0,
        answerGroups: ordered(question.answers).map(toGroup),
      })),
    })),
  }
}
