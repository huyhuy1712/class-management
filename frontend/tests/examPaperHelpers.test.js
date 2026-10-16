import test from 'node:test'
import assert from 'node:assert/strict'
import { isQuestionAnswered, formatRemainingTime, getReviewStatus } from '../src/pages/student/exams/helpers/examPaperHelpers.js'

test('review leaves unanswered white, follows BE correctness and does not invent essay grades', () => {
  assert.equal(getReviewStatus({ type: 'SINGLE' }, undefined, { correct: false }), 'EMPTY')
  assert.equal(getReviewStatus({ type: 'SINGLE' }, 0, { correct: true }), 'CORRECT')
  assert.equal(getReviewStatus({ type: 'SINGLE' }, 1, { correct: false }), 'WRONG')
  assert.equal(getReviewStatus({ type: 'TRUE_FALSE' }, { 0: false }, { correct: false }), 'WRONG')
  assert.equal(getReviewStatus({ type: 'ESSAY' }, 'Bài viết', { correct: null }), 'PENDING')
  assert.equal(getReviewStatus({ type: 'ESSAY' }, 'Bài viết', { correct: null, score: 0 }), 'GRADED')
  assert.equal(getReviewStatus({ type: 'ESSAY' }, 'Bài viết', { correct: null, score: 0.75 }), 'GRADED')
  assert.equal(getReviewStatus({ type: 'ESSAY' }, 'Bài viết', { correct: null, score: null }), 'PENDING')
})

test('question progress handles the first choice, false answers and incomplete true/false groups', () => {
  assert.equal(isQuestionAnswered({ type: 'SINGLE' }, 0), true)
  assert.equal(isQuestionAnswered({ type: 'SINGLE' }, undefined), false)
  assert.equal(isQuestionAnswered({ type: 'MULTIPLE' }, []), false)
  assert.equal(isQuestionAnswered({ type: 'MULTIPLE' }, [0]), true)
  const question = { type: 'TRUE_FALSE', statements: ['a', 'b'] }
  assert.equal(isQuestionAnswered(question, { 0: false }), false)
  assert.equal(isQuestionAnswered(question, { 0: false, 1: true }), true)
  assert.equal(isQuestionAnswered({ type: 'SHORT' }, '  '), false)
  assert.equal(isQuestionAnswered({ type: 'SHORT' }, '0'), true)
})

test('timer never displays negative remaining time', () => {
  assert.equal(formatRemainingTime(1200), '20:00')
  assert.equal(formatRemainingTime(59), '00:59')
  assert.equal(formatRemainingTime(-1), '00:00')
})
