export const ANSWER_TYPES = [
  { value: 'TEXT', label: 'Văn bản' },
  { value: 'SINGLE_CHOICE', label: 'Một đáp án' },
  { value: 'MULTIPLE_CHOICE', label: 'Nhiều đáp án' },
  { value: 'TRUE_FALSE', label: 'Đúng / Sai' },
]

export const createSection = (index) => ({
  id: crypto.randomUUID(),
  title: `Phần ${index + 1}`,
  imageUrl: '',
  audioUrl: '',
  orderIndex: index + 1,
  questions: [],
})

export const createQuestion = (index) => ({
  id: crypto.randomUUID(),
  content: '',
  imageUrl: '',
  audioUrl: '',
  point: 1,
  orderIndex: index + 1,
  scoringType: 'PER_QUESTION',
  answers: [],
})

export const createAnswer = (type, index) => ({
  id: crypto.randomUUID(),
  answerType: type,
  content: type === 'TRUE_FALSE' ? 'Đúng' : '',
  imageUrl: '',
  audioUrl: '',
  orderIndex: index + 1,
  point: 0,
})
