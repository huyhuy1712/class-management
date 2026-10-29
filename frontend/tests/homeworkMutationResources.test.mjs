import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isAffectedQuery, mutationResources } from '../src/query/mutationResources.js'

test('homework writes refresh teacher/student lists and only the matching assignment details', () => {
  const resources = mutationResources('/homework-assignments/19/submissions/23/grade', 'put')
  assert.deepEqual(resources, ['teacherHomeworks', 'teacherHomework', 'homeworkSubmissions', 'classHomeworks', 'studentHomeworks', 'studentHomework'])
  assert.equal(isAffectedQuery(['account', 'TEACHER:1:1', 'homeworkSubmissions', '19'], '/homework-assignments/19/submissions/23/grade', 'put'), true)
  assert.equal(isAffectedQuery(['account', 'TEACHER:1:1', 'homeworkSubmissions', '20'], '/homework-assignments/19/submissions/23/grade', 'put'), false)
  assert.equal(isAffectedQuery(['account', 'STUDENT:23:1', 'studentHomeworks'], '/homework-assignments/19/submission', 'put'), true)
  assert.equal(isAffectedQuery(['account', 'TEACHER:1:1', 'classHomeworks', '8'], '/homework-assignments/19/submission', 'put'), true)
})
