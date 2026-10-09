import test from 'node:test'
import assert from 'node:assert/strict'
import { buildExamPayload } from '../src/pages/teacher/exams/builder/helpers/examPayload.js'
import { validateExamForm, normalizeExamForm } from '../src/pages/teacher/exams/create/helpers/examFormValidation.js'
import { mapExamApiErrors } from '../src/pages/teacher/exams/builder/helpers/examApiErrors.js'

const form = normalizeExamForm({ title: 'Đề', subjectId: 1, gradeLevel: '10' })
test('assignment sends nullable local times for all target types without UTC conversion', () => {
  for (const accessType of ['ALL', 'CLASS', 'STUDENT']) {
    const config = { ...form, accessType, classIds: [1], studentIds: [2] }
    assert.equal(buildExamPayload(config, []).assignment.openTime, null)
    assert.equal(buildExamPayload(config, []).assignment.closeTime, null)
    const timed = { ...config, openTime: '2026-10-09T08:00', closeTime: '2026-10-10T17:00' }
    assert.equal(buildExamPayload(timed, []).assignment.openTime, timed.openTime)
    assert.equal(buildExamPayload(timed, []).assignment.closeTime, timed.closeTime)
  }
})
test('schedule accepts empty or one-sided times and rejects non-increasing endpoints', () => {
  const validate = (times) => validateExamForm({ ...form, ...times }, 'ALL', [], [])
  assert.deepEqual(validate({}), {})
  assert.deepEqual(validate({ openTime: '2026-10-09T08:00' }), {})
  assert.deepEqual(validate({ closeTime: '2026-10-09T08:00' }), {})
  assert.ok(validate({ openTime: '2026-10-09T08:00', closeTime: '2026-10-09T08:00' }).closeTime)
  assert.ok(validate({ openTime: 'invalid' }).openTime)
  assert.deepEqual(mapExamApiErrors({ 'assignment.closeTime': 'Sai thời gian' }).configErrors, { closeTime: 'Sai thời gian' })
})

 test('configuration modal restores assignment times and keeps session edits', async () => {
  const { getExamConfigurationForm } = await import('../src/pages/teacher/exams/helpers/examConfigurationForm.js')
  const exam = { id: 1, assignments: [{ assignmentType: 'CLASS', classIds: [21], openTime: '2026-10-09T08:00:00', closeTime: null }] }
  const initial = getExamConfigurationForm(exam)
  assert.equal(initial.openTime, '2026-10-09T08:00:00')
  assert.equal(initial.closeTime, '')
  assert.deepEqual(initial.classIds, [21])
  assert.equal(getExamConfigurationForm({ ...exam, openTime: '' }).openTime, '')
})
