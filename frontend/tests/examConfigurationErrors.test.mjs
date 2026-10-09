import test from 'node:test'
import assert from 'node:assert/strict'
import { mapConfigurationErrors, focusConfigurationError } from '../src/pages/teacher/exams/helpers/examConfigurationErrors.js'

test('server validation maps nested and legacy fields to configuration inputs', () => {
  assert.deepEqual(mapConfigurationErrors({ 'basicInfo.title': 'Thiếu tên', 'assignment.closeTime': 'Sai thời gian', 'assignment.classIds[0]': 'Sai lớp', subjectId: 'Thiếu môn' }), { title: 'Thiếu tên', closeTime: 'Sai thời gian', accessType: 'Sai lớp', subjectId: 'Thiếu môn' })
})
test('focus stays inside modal and scrolls the first invalid input into view', () => {
  const previous = globalThis.requestAnimationFrame
  globalThis.requestAnimationFrame = (callback) => callback()
  try {
    let scrolled = false, focused = false
    const field = { name: 'closeTime', scrollIntoView: () => { scrolled = true }, focus: () => { focused = true } }
    focusConfigurationError({ querySelectorAll: () => [field] }, { closeTime: 'Sai thời gian' })
    assert.equal(scrolled, true)
    assert.equal(focused, true)
  } finally { globalThis.requestAnimationFrame = previous }
})
