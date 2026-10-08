import assert from 'node:assert/strict'
import { before, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

let api, examService, mediaService
before(async () => {
  api = { post: (...args) => api.handler(...args) }
  // Evaluate the real service modules with an isolated HTTP transport.
  // The shared Axios client remains unchanged; no network or credentials are used.
  const loadService = async (name) => {
    const source = await readFile(new URL(`../src/services/${name}.js`, import.meta.url), 'utf8')
    return runInNewContext(source.replace("import api from './api'", '').replace(`export default ${name}`, name), { api, FormData })
  }
  examService = await loadService('examService')
  mediaService = await loadService('examMediaService')
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
