import test from 'node:test'
import assert from 'node:assert/strict'
import { buildExamContentPayload, applyContentIdMappings } from '../src/pages/teacher/exams/builder/helpers/examContentPayload.js'
import { buildExamPayload } from '../src/pages/teacher/exams/builder/helpers/examPayload.js'
const sections = [{ id: 1, title: 'Phần', paragraph: 'Đoạn văn', questions: [{ id: 'new-question', content: 'Câu hỏi', answerGroups: [{ id: 'new-answer', answerType: 'CHOICE', choiceMode: 'SINGLE', answers: [{ id: 'new-option', content: 'A', point: 1, isCorrect: true, imageMedia: { mediaId: 'media' } }], scoringRules: [] }] }] }]

test('create and edit send explanation with math and send null when removed', () => {
  const input = structuredClone(sections)
  input[0].questions[0].explanation = '  Vì $x=2$, đáp án là B.  '
  input[0].questions[0].explanationImageMedia = { mediaId: 'solution-image' }
  input[0].questions[0].explanationAudioMedia = { mediaId: 'solution-audio' }
  assert.equal(buildExamContentPayload(input, 4).sections[0].questions[0].explanationImageMediaId, 'solution-image')
  assert.equal(buildExamContentPayload(input, 4).sections[0].questions[0].explanationAudioMediaId, 'solution-audio')
  assert.equal(buildExamPayload({}, input).sections[0].questions[0].explanation, 'Vì $x=2$, đáp án là B.')
  assert.equal(buildExamContentPayload(input, 4).sections[0].questions[0].explanation, 'Vì $x=2$, đáp án là B.')
  input[0].questions[0].explanation = ''
  assert.equal(buildExamContentPayload(input, 5).sections[0].questions[0].explanation, null)
})
test('content PUT preserves server IDs and sends client IDs for new nodes', () => {
  const payload = buildExamContentPayload(sections, 4, 'token')
  assert.equal(payload.revision, 4)
  assert.equal(payload.draftToken, 'token')
  assert.equal(payload.sections[0].id, 1)
  assert.equal(payload.sections[0].paragraph, 'Đoạn văn')
  const question = payload.sections[0].questions[0]
  assert.equal(question.clientId, 'new-question')
  assert.equal(question.answers[0].clientId, 'new-answer')
  assert.equal(question.answers[0].options[0].clientId, 'new-option')
  assert.equal(question.answers[0].options[0].imageMediaId, 'media')
  assert.equal(payload.basicInfo, undefined)
  assert.equal(payload.assignment, undefined)
})
test('response ID mappings allow subsequent saves to update the same nodes', () => {
  const mapped = applyContentIdMappings(sections, { questions: [{ clientId: 'new-question', id: 2 }], answers: [{ clientId: 'new-answer', id: 3 }], options: [{ clientId: 'new-option', id: 4 }] })
  const payload = buildExamContentPayload(mapped, 5, 'token')
  assert.equal(payload.sections[0].questions[0].id, 2)
  assert.equal(payload.sections[0].questions[0].answers[0].id, 3)
  assert.equal(payload.sections[0].questions[0].answers[0].options[0].id, 4)
  assert.equal(sections[0].questions[0].id, 'new-question')
})
