import assert from 'node:assert/strict'
import { before, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

let api, examService, mediaService
before(async () => {
  api = { put: (...args) => api.handler(...args), get: (...args) => api.handler(...args), post: (...args) => api.handler(...args) }
  // Evaluate the real service modules with an isolated HTTP transport.
  // The shared Axios client remains unchanged; no network or credentials are used.
  const loadService = async (name) => {
    const source = await readFile(new URL(`../src/services/${name}.js`, import.meta.url), 'utf8')
    return runInNewContext(source.replace("import api from './api'", '').replace(`export default ${name}`, name), { api, FormData })
  }
  examService = await loadService('examService')
  mediaService = await loadService('examMediaService')
})

test('assignment attempts forward class scope, search and pagination; comment writes omit grades', async () => {
  const signal = new AbortController().signal
  const params = { classId: 21, page: 2, size: 12, q: 'Huy', status: 'SUBMITTED', sort: 'score_desc' }
  const response = { items: [{ attemptId: null, status: 'NOT_STARTED' }], stats: { total: 10, notStarted: 1 }, totalElements: 1 }
  api.handler = async (url, options) => {
    assert.equal(url, '/exam-assignments/8/attempts')
    assert.equal(options.params, params)
    assert.equal(options.signal, signal)
    return { data: response }
  }
  assert.equal(await examService.getAssignmentAttempts(8, params, { signal }), response)
  api.patch = async (url, body) => {
    assert.equal(url, '/exam-attempts/42/grades')
    assert.equal(body.attemptNumber, 2)
    assert.equal(body.revision, 5)
    assert.equal(body.teacherComment, '')
    assert.equal(Object.hasOwn(body, 'grades'), false)
    return { data: { revision: 6, teacherComment: null, totalScore: 7 } }
  }
  assert.equal((await examService.updateAttemptGrades(42, { attemptNumber: 2, revision: 5, teacherComment: '' })).totalScore, 7)
})

test('class exam list uses classroom scope and forwards query cancellation', async () => {
  const signal = new AbortController().signal
  const rows = [{ assignmentId: 12, examId: 7, gradedCount: 3, pendingGradingCount: 2 }]
  api.handler = async (url, options) => {
    assert.equal(url, '/classes/21/exams')
    assert.equal(options.signal, signal)
    return { data: rows }
  }
  assert.equal(await examService.getClassExams(21, { signal }), rows)
})

test('copy uses a stable request ID and returns the new independent draft', async () => {
  const response = { id: 99, status: 'DRAFT', code: 'NEW', sections: [], assignments: [{ id: 100 }] }
  let calls = 0
  api.handler = async (url, body) => {
    calls++
    assert.equal(url, '/exams/7/copy')
    assert.equal(body.requestId, 'same-request')
    return { data: response }
  }
  assert.equal(await examService.copyExam(7, 'same-request'), response)
  assert.equal(await examService.copyExam(7, 'same-request'), response)
  assert.equal(calls, 2)
  api.handler = async () => { throw new Error('Response lost') }
  await assert.rejects(examService.copyExam(7, 'same-request'), /Response lost/)
})

test('student exam list reads every page and preserves server statistics and sort', async () => {
  const signal = new AbortController().signal
  const stats = { completedCount: 2, notStartedCount: 99, pendingGradingCount: 0 }
  api.handler = async (url, options) => {
    assert.equal(url, '/users/me/exams')
    assert.equal(options.signal, signal)
    assert.equal(options.params.sort, 'oldest')
    const page = options.params.page
    return { data: { items: Array.from({ length: page === 0 ? 100 : 1 }, (_, i) => ({ assignmentId: page * 100 + i + 1 })), totalElements: 101, stats } }
  }
  const result = await examService.getStudentExams({ signal }, 'oldest')
  assert.equal(result.items.length, 101)
  assert.equal(result.items[100].assignmentId, 101)
  assert.equal(result.stats, stats)
  api.handler = async (url) => { assert.equal(url, '/exam-assignments/101'); return { data: { assignmentId: 101, canResume: true } } }
  assert.equal((await examService.getStudentAssignment(101)).canResume, true)
})

test('attempt writes preserve generation, revision, event UUIDs and answer option IDs', async () => {
  const body = { attemptNumber: 2, revision: 7, answers: [{ answerId: 101, selectedOptionIds: [11] }], events: [{ eventId: 'same-id-for-retry', type: 'TAB_HIDDEN' }] }
  for (const [method, path] of [['saveAttempt', '/exam-attempts/42/answers'], ['submitAttempt', '/exam-attempts/42/submit']]) {
    api.handler = async (url, payload) => { assert.equal(url, path); assert.equal(payload, body); return { data: { attemptId: 42, revision: 8 } } }
    assert.equal((await examService[method](42, body)).revision, 8)
  }
  const start = { requestId: 'stable-start-request', expectedAttemptCount: 1 }
  api.handler = async (url, payload) => { assert.equal(url, '/exam-assignments/12/attempts'); assert.equal(payload, start); return { data: { attemptId: 42 } } }
  assert.equal((await examService.startAttempt(12, start)).attemptId, 42)
  api.handler = async (url) => { assert.equal(url, '/exam-attempts/42/result'); return { data: { scoreVisible: false, answersVisible: false, sections: [], totalScore: null } } }
  const result = await examService.getAttemptResult(42)
  assert.equal(result.scoreVisible, false)
  assert.equal(result.answersVisible, false)
})

test('create service forwards assignment unchanged and returns BE result', async () => {
  const response = { id: 105, code: 'EX-14-ABCDEF', status: 'DRAFT', assignmentId: 12, maxScore: 1 }
  let requests = 0
  api.handler = async (url, payload) => {
    requests++
    assert.equal(url, '/exams')
    assert.deepEqual(payload.assignment, { assignmentType: 'STUDENT', studentIds: [10, 20], classIds: [] })
    return { data: response }
  }
  const result = await examService.createExam({ assignment: { assignmentType: 'STUDENT', studentIds: [10, 20], classIds: [] } })
  assert.equal(requests, 1)
  assert.deepEqual(result, response)
})

test('media service posts file with the same draftToken and does not retry errors', async () => {
  const file = new Blob(['image'], { type: 'image/png' })
  api.handler = async (url, data) => {
    assert.equal(url, '/exam-media')
    assert.equal(data.get('draftToken'), 'draft-token')
    assert.equal(data.get('type'), 'IMAGE')
    assert.equal(data.get('file').size, file.size)
    return { data: { mediaId: 'uploaded' } }
  }
  assert.equal((await mediaService.upload('draft-token', 'IMAGE', file)).mediaId, 'uploaded')
  let calls = 0
  api.handler = async () => { calls++; throw new Error('Response lost') }
  await assert.rejects(examService.createExam({}), /Response lost/)
  assert.equal(calls, 1)
})

test('exam reads use the detail and configuration routes and return server data', async () => {
  for (const [method, path] of [['getExamDetail', '/exams/42'], ['getExamConfiguration', '/exams/42/configuration']]) {
    const response = { id: 42, basicInfo: { title: 'Đề thật' }, assignments: [] }
    api.handler = async (url) => { assert.equal(url, path); return { data: response } }
    assert.deepEqual(await examService[method](42), response)
  }
})

test('configuration PUT sends the new nested contract and returns server configuration', async () => {
  const payload = { basicInfo: { title: 'Tên mới' }, assignment: { id: 7, openTime: null, closeTime: null } }
  const response = { id: 42, basicInfo: payload.basicInfo, assignments: [payload.assignment] }
  api.handler = async (url, sent) => {
    assert.equal(url, '/exams/42')
    assert.deepEqual(sent, payload)
    return { data: response }
  }
  assert.deepEqual(await examService.updateExamConfiguration(42, payload), response)
})

test('content update uses its dedicated PUT route', async () => {
  const payload = { revision: 2, sections: [] }
  api.handler = async (url, sent) => { assert.equal(url, '/exams/42/content'); assert.deepEqual(sent, payload); return { data: { revision: 3 } } }
  assert.equal((await examService.updateExamContent(42, payload)).revision, 3)
})
