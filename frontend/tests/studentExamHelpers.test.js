import test from 'node:test'
import assert from 'node:assert/strict'
import { filterStudentExams, getExamStatus, getExamAssignmentDate, getUnstartedAvailableExams } from '../src/pages/student/exams/helpers/studentExamHelpers.js'

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
test('personal filter selects STUDENT assignments even when they also have a class context', () => {
  const items = [
    { assignmentId: 1, assignmentType: 'STUDENT', classes: [{ id: 21 }] },
    { assignmentId: 2, assignmentType: 'ALL', classes: [{ id: 21 }] },
  ]
  const filters = { search: '', classId: 'PERSONAL', date: '', order: 'SERVER' }
  assert.deepEqual(filterStudentExams(items, filters).map((item) => item.assignmentId), [1])
})
test('waiting page respects Vietnam time, exclusive closing, remaining attempts and BE authority', async () => {
  const { canEnterAssignment } = await import('../src/pages/student/exams/helpers/studentExamHelpers.js')
  const exam = { canStart: true, maxAttempts: 2, attemptsUsed: 1, openTime: '2026-10-13T10:00:00', closeTime: '2026-10-13T11:00:00' }
  assert.equal(canEnterAssignment(exam, Date.parse('2026-10-13T02:59:59Z')), false)
  assert.equal(canEnterAssignment(exam, Date.parse('2026-10-13T03:00:00Z')), true)
  assert.equal(canEnterAssignment(exam, Date.parse('2026-10-13T04:00:00Z')), false)
  const now = Date.parse('2026-10-13T03:30:00Z')
  assert.equal(canEnterAssignment({ ...exam, attemptsUsed: 2 }, now), false)
  assert.equal(canEnterAssignment({ ...exam, attemptsUsed: 2, canStart: false, canResume: true }, now), true)
  assert.equal(canEnterAssignment({ ...exam, maxAttempts: 0, attemptsUsed: 20 }, now), true)
  assert.equal(canEnterAssignment({ ...exam, canStart: false }, now), false)
  assert.equal(canEnterAssignment({ ...exam, blockedReason: 'TIME_EXPIRED', canResume: true }, now), false)
})

test('dashboard reminders include only unstarted assignments currently available to start', () => {
  const now = Date.parse('2026-10-19T17:30:00+07:00')
  const exams = [
    { assignmentId: 1, attemptStatus: 'NOT_STARTED', canStart: true, attemptsUsed: 0, maxAttempts: 2, openTime: '2026-10-19T10:00:00', closeTime: '2026-10-19T18:00:00' },
    { assignmentId: 2, attemptStatus: 'NOT_STARTED', canStart: true, attemptsUsed: 0, maxAttempts: 2, openTime: '2026-10-19T18:00:00', closeTime: '2026-10-19T19:00:00' },
    { assignmentId: 3, attemptStatus: 'NOT_STARTED', canStart: false, attemptsUsed: 0, maxAttempts: 2, closeTime: '2026-10-19T18:00:00' },
    { assignmentId: 4, attemptStatus: 'IN_PROGRESS', canStart: true, canResume: true, attemptsUsed: 1, maxAttempts: 2, closeTime: '2026-10-19T18:00:00' },
    { assignmentId: 5, attemptStatus: 'NOT_STARTED', canStart: true, attemptsUsed: 0, maxAttempts: 2, closeTime: '2026-10-19T16:00:00' },
    { assignmentId: 6, attemptStatus: 'NOT_STARTED', canStart: true, attemptsUsed: 0, maxAttempts: 2, closeTime: null },
  ]
  assert.deepEqual(getUnstartedAvailableExams(exams, now).map((exam) => exam.assignmentId), [1, 6])
})
