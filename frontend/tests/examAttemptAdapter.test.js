import test from 'node:test'
import assert from 'node:assert/strict'
import { adaptAttemptSections, readAttemptAnswers, buildAttemptAnswers } from '../src/pages/student/exams/helpers/examAttemptAdapter.js'

const paper = [{ id: 1, title: 'Phần 1', questions: [{ id: 10, content: 'Câu hỏi', answers: [
  { id: 101, answerType: 'SINGLE_CHOICE', options: [{ id: 11, content: 'A' }, { id: 12, content: 'B' }] },
  { id: 102, answerType: 'MULTIPLE_CHOICE', options: [{ id: 21, content: 'A' }, { id: 22, content: 'B' }] },
  { id: 103, answerType: 'TRUE_FALSE', options: [{ id: 31, content: 'Ý a' }, { id: 32, content: 'Ý b' }] },
  { id: 104, answerType: 'SHORT_ANSWER', options: [] },
  { id: 105, answerType: 'ESSAY', options: [] },
] }] }]
const questions = adaptAttemptSections(paper).flatMap((section) => section.questions)

test('attempt adapter uses answer group IDs, preserves option IDs and does not use question IDs for submissions', () => {
  const values = { 101: 0, 102: [0, 1], 103: { 0: false }, 104: '0', 105: 'Bài viết' }
  const payload = buildAttemptAnswers(questions, values)
  assert.deepEqual(payload.map((item) => item.answerId), [101, 102, 103, 104, 105])
  assert.deepEqual(payload[0].selectedOptionIds, [11])
  assert.deepEqual(payload[1].selectedOptionIds, [21, 22])
  assert.deepEqual(payload[2].booleanAnswers, [{ optionId: 31, value: false }])
  assert.equal(payload[3].text, '0')
  assert.deepEqual(readAttemptAnswers(questions, payload), values)
})

test('unanswered fields are omitted while cleared values are sent to replace previous answers', () => {
  assert.deepEqual(buildAttemptAnswers(questions, {}), [])
  const values = { 102: [], 103: {}, 104: '' }
  assert.deepEqual(readAttemptAnswers(questions, buildAttemptAnswers(questions, values)), values)
})

test('paper adapter keeps every group and media without modifying the BE paper', () => {
  assert.equal(questions.length, 5)
  assert.equal(questions[0].sourceQuestionId, 10)
  assert.equal(questions[0].type, 'SINGLE')
  assert.equal(questions[3].type, 'SHORT')
  assert.equal(paper[0].questions[0].answers[0].answerType, 'SINGLE_CHOICE')
})
