import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildAssignmentGradeExport, assignmentGradeCsv } from '../src/pages/teacher/exams/helpers/assignmentGradeExport.js'

test('export sorts ascending, includes absent zero and excludes unfinished scores from statistics', () => {
  const report = buildAssignmentGradeExport([
    { studentId: 1, fullName: 'A', status: 'GRADED', totalScore: 16 },
    { studentId: 2, fullName: 'B', status: 'NOT_STARTED', totalScore: null },
    { studentId: 3, fullName: 'C', status: 'GRADED', totalScore: 13 },
    { studentId: 4, fullName: 'D', status: 'GRADED', totalScore: 10 },
    { studentId: 5, fullName: 'E', status: 'SUBMITTED', totalScore: 8 },
  ], 20)
  assert.deepEqual(report.rows.map((row) => row.score), [0, 8, 10, 13, 16])
  assert.equal(report.summary.average, 4.875)
  assert.deepEqual([report.summary.excellent, report.summary.good, report.summary.averageCount, report.summary.weak], [1, 1, 1, 1])
  assert.equal(report.summary.pending, 1)
})

test('export handles modes, no results and spreadsheet formula injection', () => {
  const report = buildAssignmentGradeExport([
    { fullName: '=HYPERLINK("bad")', status: 'NOT_STARTED' },
    { fullName: 'B', status: 'NOT_STARTED' },
  ], 10)
  assert.deepEqual(report.summary.modes, [0])
  const csv = assignmentGradeCsv(report, 'Đề, "Toán"', 8, 10)
  assert.ok(csv.startsWith('\uFEFF'))
  assert.ok(csv.includes("'=HYPERLINK"))
  assert.ok(csv.includes('Đề, ""Toán""'))
  assert.equal(buildAssignmentGradeExport([], 10).summary.average, null)
  assert.throws(() => buildAssignmentGradeExport([], 0))
})
