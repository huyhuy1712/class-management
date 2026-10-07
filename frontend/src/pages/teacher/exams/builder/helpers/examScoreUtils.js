export const getQuestionScore = (question) => Number(question.point) || 0

export const getSectionScore = (section) =>
  section.questions.reduce((total, question) => total + getQuestionScore(question), 0)

export const getExamScore = (sections) =>
  sections.reduce((total, section) => total + getSectionScore(section), 0)
