import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

test('class gradebook forwards class scope, subject, search, pagination and abort signal', async () => {
  const source = await readFile(new URL('../src/services/classroomService.js', import.meta.url), 'utf8')
  const signal = new AbortController().signal
  const params = { page: 2, size: 20, q: 'An', subjectId: 1 }
  const response = { items: [{ averageScoreOnTen: null }], columns: [], totalElements: 42 }
  const api = { get: async (url, options) => {
    assert.equal(url, '/classes/21/gradebook')
    assert.equal(options.params, params)
    assert.equal(options.signal, signal)
    return { data: response }
  } }
  const service = runInNewContext(source.replace("import api from './api'", '').replace('export default classroomService', 'classroomService'), { api })
  assert.equal(await service.getGradebook(21, params, { signal }), response)
})
