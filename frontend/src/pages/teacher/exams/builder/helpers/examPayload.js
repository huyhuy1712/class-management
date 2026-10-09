import { getGroupScore, getQuestionScore } from './examScoreUtils.js'

const number = (value) => String(value ?? '').trim() === '' ? NaN : Number(value)
export const sortExamItems = (items = []) => [...items].sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex))

export function orderExamSections(sections) {
  return sortExamItems(sections).map((section) => ({
    ...section,
    questions: sortExamItems(section.questions).map((question) => ({
      ...question,
      answerGroups: sortExamItems(question.answerGroups).map((group) => ({
        ...group, answers: sortExamItems(group.answers),
      })),
    })),
  }))
}

const mediaFields = (item) => Object.fromEntries(['image', 'audio'].flatMap((type) =>
  item[`${type}Media`]?.mediaId ? [[`${type}MediaId`, item[`${type}Media`].mediaId]] : [],
))

function buildAnswer(group) {
  const choice = group.answerType === 'CHOICE'
  const trueFalse = group.answerType === 'TRUE_FALSE'
  const countScoring = trueFalse && group.scoreByCorrectCount
  const answer = {
    answerType: choice ? (group.choiceMode === 'MULTIPLE' ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE') : group.answerType === 'TEXT' ? 'ESSAY' : group.answerType,
    points: getGroupScore(group),
    scoringType: countScoring ? 'CORRECT_COUNT' : 'PER_ANSWER',
  }
  if (choice || trueFalse) {
    answer.options = group.answers.map((item) => ({
      content: item.content?.trim() ?? '',
      isCorrect: item.isCorrect === true,
      ...mediaFields(item),
      ...(trueFalse && !countScoring ? { points: number(item.point) } : {}),
    }))
    if (countScoring) answer.scoringRules = group.scoringRules.map((rule) => ({ correctCount: number(rule.correctCount), score: number(rule.point) }))
  } else {
    const item = group.answers[0] ?? {}
    Object.assign(answer, mediaFields(item))
    if (group.answerType === 'SHORT_ANSWER') answer.correctAnswerText = item.content?.trim() ?? ''
    else answer.content = item.content?.trim() ?? ''
  }
  return answer
}

export function buildExamPayload(config, sections, draftToken) {
  const assignmentType = config.accessType
  const ids = (values) => [...new Set((values ?? []).map(number))]
  return {
    basicInfo: {
      title: config.title?.trim() ?? '', subjectId: number(config.subjectId),
      gradeLevel: config.gradeLevel, description: config.description, purpose: config.purpose,
      timeLimit: number(config.timeLimit), maxAttempts: number(config.maxAttempts),
    },
    assignment: {
      assignmentType,
      openTime: config.openTime || null,
      closeTime: config.closeTime || null,
      classIds: assignmentType === 'CLASS' ? ids(config.classIds) : [],
      studentIds: assignmentType === 'STUDENT' ? ids(config.studentIds) : [],
      scoreVisibility: config.scoreVisibility, answerVisibility: config.answerVisibility,
      hideCorrectAnswerOnWrong: Boolean(config.hideWrongAnswers),
    },
    ...(draftToken ? { draftToken } : {}),
    sections: sections.map((section) => ({
      title: section.title?.trim() ?? '', paragraph: section.paragraph?.trim() || null, ...mediaFields(section),
      questions: section.questions.map((question) => ({
        content: question.content?.trim() ?? '', points: getQuestionScore(question),
        ...mediaFields(question), answers: question.answerGroups.map(buildAnswer),
      })),
    })),
  }
}

export function getExamConfig(draft, routeConfig) {
  const general = draft?.general
  if (!general?.form) return routeConfig ?? {}
  return {
    ...general.form,
    accessType: general.accessType,
    classIds: general.selectedClasses ?? [], studentIds: general.selectedStudents ?? [],
  }
}
