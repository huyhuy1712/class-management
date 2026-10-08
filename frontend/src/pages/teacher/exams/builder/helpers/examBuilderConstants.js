export const ANSWER_TYPES = [
  { value: 'TRUE_FALSE', label: 'Đúng / Sai' },
  { value: 'CHOICE', label: 'Trắc nghiệm' },
  { value: 'SHORT_ANSWER', label: 'Trả lời ngắn' },
  { value: 'TEXT', label: 'Văn bản' },
]

export const createSection = (index) => ({
  id: crypto.randomUUID(), title: `Phần ${index + 1}`, imageFile: null, audioFile: null,
  orderIndex: index + 1, questions: [],
})

export const createQuestion = (index) => ({
  id: crypto.randomUUID(), content: '', imageFile: null, audioFile: null, point: 1,
  orderIndex: index + 1, scoringType: 'PER_QUESTION', answerGroups: [],
})
export const createAnswer = (type, index) => ({
  id: crypto.randomUUID(),
  answerType: type,
  content: '',
  imageFile: null,
  audioFile: null,
  orderIndex: index + 1,
  point: 0,
  isCorrect: false,
})

export const createAnswerGroup = (index) => ({
  id: crypto.randomUUID(), answerType: null, choiceMode: 'SINGLE',
  orderIndex: index + 1, point: 0, answers: [], scoreByCorrectCount: false, scoringRules: [],
})

export const createScoringRule = () => ({
  id: crypto.randomUUID(), correctCount: '', point: '',
})
