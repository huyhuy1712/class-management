const types = { SINGLE_CHOICE: 'SINGLE', MULTIPLE_CHOICE: 'MULTIPLE', TRUE_FALSE: 'TRUE_FALSE', SHORT_ANSWER: 'SHORT', FILL_BLANK: 'SHORT', ESSAY: 'ESSAY' }

export function adaptAttemptSections(sections = []) {
  let number = 0
  return sections.map((section) => ({ ...section, questions: section.questions.flatMap((question) => {
    const questionNumber = ++number
    return question.answers.map((group, index) => ({
    ...group, id: group.id, sourceQuestionId: question.id, type: types[group.answerType], content: question.content,
    displayNumber: question.answers.length > 1 ? `${questionNumber}.${index + 1}` : questionNumber,
    explanation: index === 0 ? question.explanation : null,
    groupContent: group.content, imageMedia: question.imageMedia, audioMedia: question.audioMedia,
    groupImageMedia: group.imageMedia, groupAudioMedia: group.audioMedia,
    optionRecords: group.options, options: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(group.answerType) ? group.options.map((option) => option.content) : undefined,
    statements: group.answerType === 'TRUE_FALSE' ? group.options.map((option) => option.content) : undefined,
  }))
  }) }))
}

export function readAttemptAnswers(questions, values = []) {
  const byId = new Map(values.map((value) => [String(value.answerId), value]))
  return Object.fromEntries(questions.flatMap((question) => {
    const value = byId.get(String(question.id))
    if (!value) return []
    const selected = question.optionRecords.map((option, index) => value.selectedOptionIds?.includes(option.id) ? index : -1).filter((index) => index >= 0)
    const answer = question.type === 'SINGLE' ? selected[0] : question.type === 'MULTIPLE' ? selected : question.type === 'TRUE_FALSE'
      ? Object.fromEntries(question.optionRecords.flatMap((option, index) => { const item = value.booleanAnswers?.find((item) => item.optionId === option.id); return item ? [[index, item.value]] : [] })) : value.text ?? ''
    return [[question.id, answer]]
  }))
}

export function buildAttemptAnswers(questions, answers) {
  return questions.filter((question) => answers[question.id] !== undefined).map((question) => {
    const value = answers[question.id]
    const base = { answerId: Number(question.id), text: null, selectedOptionIds: [], booleanAnswers: [] }
    if (question.type === 'SINGLE') base.selectedOptionIds = Number.isInteger(value) ? [question.optionRecords[value].id] : []
    else if (question.type === 'MULTIPLE') base.selectedOptionIds = value.map((index) => question.optionRecords[index].id)
    else if (question.type === 'TRUE_FALSE') base.booleanAnswers = Object.entries(value).filter(([, item]) => typeof item === 'boolean').map(([index, item]) => ({ optionId: question.optionRecords[Number(index)].id, value: item }))
    else base.text = value
    return base
  })
}
