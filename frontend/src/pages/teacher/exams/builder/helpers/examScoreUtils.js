export const getQuestionScore = (question) => Number(question.point) || 0

export const getSectionScore = (section) =>
  Number(section.questions.reduce((total, question) => total + getQuestionScore(question), 0).toFixed(2))

export const getExamScore = (sections) =>
  Number(sections.reduce((total, section) => total + getSectionScore(section), 0).toFixed(2))
