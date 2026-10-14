import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeGradeAttempts } from '../src/pages/student/grades/helpers/gradeOverviewDemo.js'

test('overview normalizes different scales, keeps zero and excludes pending points', () => {
  const stats = summarizeGradeAttempts([{ status: 'GRADED', score: 0, maxScore: 20 }, { status: 'GRADED', score: 16, maxScore: 20 }, { status: 'SUBMITTED', score: 10, maxScore: 10 }])
  assert.equal(stats.average, 4)
  assert.equal(stats.lowest, 0)
  assert.equal(stats.highest, 8)
  assert.equal(stats.pending, 1)
  assert.equal(stats.passed, 1)
  assert.deepEqual(stats.bands, [1, 0, 0, 1])
  assert.deepEqual(stats.modes, [])
})
test('overview returns all tied modes rather than arbitrarily picking one', () => {
  const items = [5, 5, 8, 8, 9].map((score) => ({ status: 'GRADED', score, maxScore: 10 }))
  assert.deepEqual(summarizeGradeAttempts(items).modes, [5, 8])
})
test('empty overview does not invent zero scores', () => {
  const stats = summarizeGradeAttempts([])
  assert.equal(stats.average, null)
  assert.equal(stats.lowest, null)
  assert.equal(stats.highest, null)
  assert.deepEqual(stats.modes, [])
})
