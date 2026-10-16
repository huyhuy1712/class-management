import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adaptGradeItem } from '../src/pages/student/grades/helpers/gradeOverviewAdapter.js'

test('unpublished grades stay hidden, including zero grades', () => {
  const item = { attemptId: 1, score: 8, scoreVisible: false, classes: [], submittedAt: null }
  assert.equal(adaptGradeItem(item).score, null)
  assert.equal(adaptGradeItem({ ...item, score: 0, scoreVisible: true }).score, 0)
})

test('grades preserve attempt identity and use the local submission date', () => {
  const row = adaptGradeItem({ attemptId: 2, assignmentId: 8, attemptNumber: 3, scoreVisible: true, score: 7,
    classes: [{ name: 'Toán' }], submittedAt: '2026-10-14T18:00:00Z', durationSeconds: null })
  assert.equal(row.id, 2)
  assert.equal(row.attemptNumber, 3)
  assert.equal(row.classroom, 'Toán')
  assert.equal(row.date, '2026-10-15')
  assert.equal(row.minutes, null)
})
