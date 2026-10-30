import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterStudentHomeworks } from '../src/pages/student/homework/helpers/homeworkFilters.js'

const now = new Date('2026-10-23T10:00:00').getTime()
const homeworks = [
  { assignment: { id: 1, dueAt: '2026-10-23T09:00:00' }, submissionStatus: 'NOT_SUBMITTED' },
  { assignment: { id: 2, dueAt: '2026-10-24T09:00:00' }, submissionStatus: 'NOT_SUBMITTED' },
  { assignment: { id: 3, dueAt: null }, submissionStatus: 'NOT_SUBMITTED' },
  { assignment: { id: 4, dueAt: '2026-10-20T09:00:00' }, submissionStatus: 'REOPENED' },
  { assignment: { id: 5, dueAt: '2026-10-20T09:00:00' }, submissionStatus: 'SUBMITTED' },
  { assignment: { id: 6, dueAt: '2026-10-20T09:00:00' }, submissionStatus: 'GRADED' },
]

test('student homework filters split overdue, work to do and submitted assignments', () => {
  assert.deepEqual(filterStudentHomeworks(homeworks, 'ALL', now).map(({ assignment }) => assignment.id), [1, 2, 3, 4, 5, 6])
  assert.deepEqual(filterStudentHomeworks(homeworks, 'OVERDUE', now).map(({ assignment }) => assignment.id), [1])
  assert.deepEqual(filterStudentHomeworks(homeworks, 'NOT_DONE', now).map(({ assignment }) => assignment.id), [2, 3, 4])
  assert.deepEqual(filterStudentHomeworks(homeworks, 'SUBMITTED', now).map(({ assignment }) => assignment.id), [5, 6])
})
