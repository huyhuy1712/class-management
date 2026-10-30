import assert from 'node:assert/strict'
import { before, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

let api
let homeworkService

before(async () => {
  api = {
    get: (...args) => api.handler('get', ...args),
    post: (...args) => api.handler('post', ...args),
    put: (...args) => api.handler('put', ...args),
  }
  const source = await readFile(new URL('../src/services/homeworkService.js', import.meta.url), 'utf8')
  homeworkService = runInNewContext(
    source.replace("import api from './api'", '').replace('export default homeworkService', 'homeworkService'),
    { api, FormData },
  )
})

test('creating homework sends the selected scope, optional due date, score and prompt file', async () => {
  api.handler = async (method, url, body) => {
    assert.equal(method, 'post')
    assert.equal(url, '/homework-assignments')
    assert.equal(body.get('title'), 'Bài tập chương 1')
    assert.equal(body.get('subjectId'), '4')
    assert.equal(body.get('gradeLevel'), '10')
    assert.equal(body.get('purpose'), 'Luyện tập')
    assert.equal(body.get('assignmentType'), 'CLASS')
    assert.equal(body.get('classIds'), '8')
    assert.equal(body.get('studentIds'), null)
    assert.equal(body.get('dueAt'), '2026-10-30T23:59')
    assert.equal(body.get('maxScore'), '10')
    assert.equal(body.get('file').name, 'de-bai.pdf')
    assert.equal(body.get('audioFile').name, 'de-nghe.mp3')
    return { data: { id: 19 } }
  }
  const response = await homeworkService.create({
    title: 'Bài tập chương 1',
    instructions: '',
    subjectId: 4,
    gradeLevel: '10',
    purpose: 'Luyện tập',
    assignmentType: 'CLASS',
    classIds: [8],
    dueAt: '2026-10-30T23:59',
    maxScore: 10,
    file: new File(['prompt'], 'de-bai.pdf', { type: 'application/pdf' }),
    audioFile: new File(['audio'], 'de-nghe.mp3', { type: 'audio/mpeg' }),
  })
  assert.equal(response.id, 19)
})

test('class homework list and submission review retain the selected class scope', async () => {
  api.handler = async (method, url, options) => {
    assert.equal(method, 'get')
    if (url === '/homework-assignments/classes/21') {
      assert.equal(options.signal, undefined)
      return { data: [{ id: 19 }] }
    }
    assert.equal(url, '/homework-assignments/19/submissions')
    assert.equal(options.params.classId, '21')
    return { data: [{ studentId: 5 }] }
  }
  assert.equal((await homeworkService.getTeacherList('21'))[0].id, 19)
  assert.equal((await homeworkService.getSubmissions(19, '21'))[0].studentId, 5)
})

test('student homework list can be scoped to a class', async () => {
  api.handler = async (method, url, options) => {
    assert.equal(method, 'get')
    assert.equal(url, '/homework-assignments/me')
    assert.deepEqual(options.params, { classId: 21 })
    return { data: [{ assignment: { id: 19 } }] }
  }
  assert.equal((await homeworkService.getStudentList({ params: { classId: 21 } }))[0].assignment.id, 19)
})

test('student submission supports text with multiple images and deadline update can remove the due date', async () => {
  api.handler = async (method, url, body) => {
    assert.equal(method, 'put')
    if (url.endsWith('/submission')) {
      assert.equal(url, '/homework-assignments/19/submission')
      assert.equal(body.get('answerText'), 'Câu trả lời')
      assert.deepEqual(body.getAll('images').map((file) => file.name), ['trang-1.jpg', 'trang-2.png'])
      assert.equal(body.get('audio').name, 'cau-tra-loi.mp3')
      return { data: { submissionStatus: 'SUBMITTED' } }
    }
    assert.equal(url, '/homework-assignments/19/deadline')
    assert.equal(body.dueAt, null)
    return { data: { id: 19, dueAt: null } }
  }
  const result = await homeworkService.submit(19, 'Câu trả lời', [
    new File(['page 1'], 'trang-1.jpg', { type: 'image/jpeg' }),
    new File(['page 2'], 'trang-2.png', { type: 'image/png' }),
  ], new File(['answer'], 'cau-tra-loi.mp3', { type: 'audio/mpeg' }))
  assert.equal(result.submissionStatus, 'SUBMITTED')
  assert.equal((await homeworkService.updateDeadline(19, '')).dueAt, null)
})

test('student can submit an audio-only homework answer', async () => {
  api.handler = async (method, url, body) => {
    assert.equal(method, 'put')
    assert.equal(url, '/homework-assignments/19/submission')
    assert.equal(body.get('answerText'), null)
    assert.equal(body.get('audio').name, 'noi-tieng-anh.m4a')
    return { data: { submissionStatus: 'SUBMITTED', audioName: 'noi-tieng-anh.m4a' } }
  }
  const result = await homeworkService.submit(
    19,
    '',
    [],
    new File(['audio'], 'noi-tieng-anh.m4a', { type: 'audio/mp4' }),
  )
  assert.equal(result.submissionStatus, 'SUBMITTED')
})

test('teacher grade and reopen requests use the student-specific submission endpoints', async () => {
  api.handler = async (method, url, body) => {
    assert.equal(url, '/homework-assignments/19/submissions/23/grade')
    assert.equal(method, 'put')
    assert.equal(body.score, 8.5)
    assert.equal(body.teacherComment, 'Tốt')
    return { data: { status: 'GRADED' } }
  }
  assert.equal((await homeworkService.gradeSubmission(19, 23, '8.5', 'Tốt')).status, 'GRADED')
  api.handler = async (method, url) => {
    assert.equal(method, 'post')
    assert.equal(url, '/homework-assignments/19/submissions/23/reopen')
    return { data: undefined }
  }
  await homeworkService.reopenSubmission(19, 23)
})
