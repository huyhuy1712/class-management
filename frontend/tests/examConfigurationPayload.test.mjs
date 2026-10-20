import test from 'node:test'
import assert from 'node:assert/strict'
import { buildExamConfigurationPayload, buildNewAssignmentPayload } from '../src/pages/teacher/exams/helpers/examConfigurationPayload.js'

const form = { title: ' Đề mới ', subjectId: '2', gradeLevel: '10', timeLimit: '60', maxAttempts: '1', accessType: 'CLASS', classIds: ['21', 21], studentIds: [7], scoreVisibility: 'AFTER_SUBMIT', answerVisibility: 'NEVER', hideWrongAnswers: true, openTime: '', closeTime: '2026-10-10T17:00' }
test('reassignment creates a separate round payload without exam edits or old assignment identity', () => {
  const payload = buildNewAssignmentPayload({ ...form, accessType: 'STUDENT', classId: '21', studentIds: [7], closeTime: '' }, 'stable-request')
  assert.equal(payload.requestId, 'stable-request')
  assert.equal(payload.timeLimit, 60)
  assert.equal(payload.maxAttempts, 1)
  assert.equal(payload.basicInfo, undefined)
  assert.equal(payload.assignment.id, undefined)
  assert.equal(payload.assignment.classId, 21)
  assert.deepEqual(payload.assignment.studentIds, [7])
  assert.equal(payload.assignment.closeTime, null)
})
test('new update payload preserves assignment identity and threshold while mapping edited fields', () => {
  const result = buildExamConfigurationPayload(form, { id: 3, threshold: 5 })
  assert.equal(result.basicInfo.title, 'Đề mới')
  assert.equal(result.basicInfo.subjectId, 2)
  assert.equal(result.basicInfo.timeLimit, 60)
  assert.equal(result.assignment.id, 3)
  assert.equal(result.assignment.threshold, 5)
  assert.deepEqual(result.assignment.classIds, [21])
  assert.deepEqual(result.assignment.studentIds, [])
  assert.equal(result.assignment.openTime, null)
  assert.equal(result.assignment.closeTime, form.closeTime)
  assert.equal(result.assignment.hideCorrectAnswerOnWrong, true)
  assert.deepEqual(Object.keys(result), ['basicInfo', 'assignment'])
})
test('target types clear inapplicable targets and missing assignment is created on save', () => {
  const student = buildExamConfigurationPayload({ ...form, accessType: 'STUDENT' }, { id: 3 })
  assert.deepEqual(student.assignment.classIds, [])
  assert.deepEqual(student.assignment.studentIds, [7])
  const all = buildExamConfigurationPayload({ ...form, accessType: 'ALL' }, { id: 3 })
  assert.deepEqual(all.assignment.classIds, [])
  assert.deepEqual(all.assignment.studentIds, [])
  assert.equal(buildExamConfigurationPayload(form, null).assignment.id, null)
})

test('student update sends the classroom context as a numeric classId', () => {
  const result = buildExamConfigurationPayload({ ...form, accessType: 'STUDENT', classId: '21' }, { id: 3 })
  assert.equal(result.assignment.classId, 21)
  assert.deepEqual(result.assignment.studentIds, [7])
  assert.equal('classId' in buildExamConfigurationPayload(form, { id: 3 }).assignment, false)
})
