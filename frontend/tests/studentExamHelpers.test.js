import test from 'node:test'
import assert from 'node:assert/strict'
import { filterStudentExams, getExamStatus, getExamAssignmentDate } from '../src/pages/student/exams/helpers/studentExamHelpers.js'

test('maps submitted and graded attempts to separate student statuses', () => {
  assert.equal(getExamStatus({ attemptStatus: 'SUBMITTED' }), 'PENDING')
  assert.equal(getExamStatus({ attemptStatus: 'GRADED' }), 'DONE')
  assert.equal(getExamStatus({ attemptStatus: 'IN_PROGRESS' }), 'TODO')
})

test('search ignores Vietnamese accents and date filtering uses Vietnam timezone', () => {
  const items = [{ title: 'Đề kiểm tra Toán', code: 'MATH-12', classes: [{ id: 21 }], createdAt: '2026-10-10T18:30:00Z' }]
  assert.equal(getExamAssignmentDate(items[0].createdAt), '2026-10-11')
  assert.equal(filterStudentExams(items, { search: '  de   toan math  ', classId: 21, date: '2026-10-11', order: 'NEWEST' }).length, 1)
  assert.equal(filterStudentExams(items, { search: '', classId: '22', date: '', order: 'NEWEST' }).length, 0)
})

test('sort compares actual timestamps and keeps missing dates last', () => {
  const items = [{ id: 1, createdAt: null }, { id: 2, createdAt: '2026-10-11T03:00:00+07:00' }, { id: 3, createdAt: '2026-10-10T22:00:00Z' }]
  const filters = { search: '', classId: '', date: '', order: 'NEWEST' }
  assert.deepEqual(filterStudentExams(items, filters).map((item) => item.id), [3, 2, 1])
  assert.deepEqual(filterStudentExams(items, { ...filters, order: 'OLDEST' }).map((item) => item.id), [2, 3, 1])
})

test('combines search, class and date filters and sorts a copy', () => {
  const items = [
    { assignmentId: 1, title: 'Toán', classes: [{ id: 21 }], createdAt: '2026-10-11T08:00:00' },
    { assignmentId: 2, title: 'TOÁN', classes: [{ id: 21 }], createdAt: '2026-10-11T09:00:00' },
    { assignmentId: 3, title: 'Toán', classes: [{ id: 22 }], createdAt: '2026-10-11T10:00:00' },
  ]
  const filters = { search: 'toán', classId: '21', date: '2026-10-11', order: 'NEWEST' }
  assert.deepEqual(filterStudentExams(items, filters).map((item) => item.assignmentId), [2, 1])
  assert.deepEqual(filterStudentExams(items, { ...filters, order: 'OLDEST' }).map((item) => item.assignmentId), [1, 2])
  assert.equal(items[0].assignmentId, 1)
})
