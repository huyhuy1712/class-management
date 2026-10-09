export const EXAM_ACCESS_TYPE = {
  ALL: 'ALL',
  CLASS: 'CLASS',
  STUDENT: 'STUDENT',
}

export const INITIAL_EXAM_FORM = {
  openTime: '',
  closeTime: '',
  title: '',
  subjectId: '',
  description: '',
  purpose: '',
  timeLimit: 60,
  maxAttempts: 1,
  gradeLevel: '',
  scoreVisibility: 'AFTER_SUBMIT',
  answerVisibility: 'AFTER_SUBMIT',
  hideWrongAnswers: false,
}

export const GRADE_OPTIONS = [
  { value: '10', label: 'Khối 10' },
  { value: '11', label: 'Khối 11' },
  { value: '12', label: 'Khối 12' },
  { value: 'UNIVERSITY', label: 'Đại học' },
  { value: 'OTHER', label: 'Khác' },
]
