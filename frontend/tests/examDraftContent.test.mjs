import test from 'node:test'
import assert from 'node:assert/strict'
import { hasExamDraftContent } from '../src/pages/teacher/exams/draft/hasExamDraftContent.js'
import { INITIAL_EXAM_FORM } from '../src/pages/teacher/exams/create/helpers/examFormConstants.js'

test('missing or auto-saved default form does not prompt to resume', () => {
  for (const draft of [null, {}, { general: {} }, { builder: { sections: [] } }, { general: { form: INITIAL_EXAM_FORM, accessType: 'ALL', selectedClasses: [], selectedStudents: [] } }, { general: { form: { ...INITIAL_EXAM_FORM, title: '   ' } } }]) assert.equal(hasExamDraftContent(draft), false)
})
test('entered information, selected targets, content and pending saves prompt to resume', () => {
  for (const draft of [{ general: { form: { title: 'Đề thử' } } }, { general: { form: { ...INITIAL_EXAM_FORM, timeLimit: 30 } } }, { general: { selectedClasses: [21] } }, { builder: { sections: [{ id: 1 }] } }, { pendingSave: { title: 'Đề' } }]) assert.equal(hasExamDraftContent(draft), true)
})
