import test from 'node:test'
import assert from 'node:assert/strict'
import { canComment, patchAttemptPage, rollbackAttemptComment, attemptDuration, scoreTone } from '../src/pages/teacher/exams/helpers/assignmentAttemptHelpers.js'

test('score colour uses half the actual exam maximum, preserves zero and handles missing scores', () => {
  assert.equal(scoreTone(0, 20), 'text-red-600')
  assert.equal(scoreTone(9.99, 20), 'text-red-600')
  assert.equal(scoreTone(10, 20), 'text-emerald-700')
  assert.equal(scoreTone(15, 20), 'text-emerald-700')
  assert.equal(scoreTone(null, 20), 'text-slate-500')
  assert.equal(scoreTone(0, null), 'text-slate-500')
})

test('not-started and in-progress students cannot receive grading comments', () => {
  assert.equal(canComment({ attemptId: null, status: 'NOT_STARTED' }), false)
  assert.equal(canComment({ attemptId: 4, status: 'IN_PROGRESS' }), false)
  assert.equal(canComment({ attemptId: 4, status: 'SUBMITTED' }), true)
  assert.equal(canComment({ attemptId: 4, status: 'GRADED' }), true)
  assert.equal(attemptDuration(null), '—')
  assert.equal(attemptDuration(0), '0 phút 0 giây')
})

test('optimistic comment preserves scores, pagination and other students; rollback preserves newer changes', () => {
  const page = { items: [{ attemptId: 4, teacherComment: 'Cũ', totalScore: 7, revision: 2 }, { attemptId: null, teacherComment: null }], totalElements: 100, stats: { graded: 10 } }
  const patched = patchAttemptPage(page, 4, { teacherComment: 'Mới' })
  assert.equal(page.items[0].teacherComment, 'Cũ')
  assert.equal(patched.items[0].totalScore, 7)
  assert.equal(patched.items[0].revision, 2)
  assert.equal(patched.items[1], page.items[1])
  assert.equal(patched.stats, page.stats)
  assert.equal(patched.totalElements, 100)
  assert.equal(rollbackAttemptComment(patched, 4, 'Mới', 'Cũ').items[0].teacherComment, 'Cũ')
  const newer = patchAttemptPage(patched, 4, { teacherComment: 'Một sửa đổi khác', revision: 3 })
  assert.equal(rollbackAttemptComment(newer, 4, 'Mới', 'Cũ').items[0].teacherComment, 'Một sửa đổi khác')
  assert.equal(rollbackAttemptComment(newer, 4, 'Mới', 'Cũ').items[0].revision, 3)
})
