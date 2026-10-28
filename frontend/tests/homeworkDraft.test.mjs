import assert from 'node:assert/strict'
import { test } from 'node:test'
import { File } from 'node:buffer'
import { clearHomeworkDraft, loadHomeworkDraft, saveHomeworkDraft } from '../src/pages/teacher/homework/homeworkDraftStorage.js'

test('homework draft preserves form progress across navigation and clears after submission', () => {
  const storage = new Map()
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  }

  clearHomeworkDraft()
  const attachment = new File(['homework'], 'bai-tap.pdf', { type: 'application/pdf' })
  saveHomeworkDraft({
    title: 'Bài luyện tập',
    instructions: 'Làm các câu trong đề',
    subjectId: '2',
    gradeLevel: '10',
    assignmentType: 'CLASS',
    classIds: [7],
    studentIds: [],
    classId: '',
    dueAt: '2026-11-01T09:00',
    maxScore: '10',
    file: attachment,
    audioFile: null,
  })

  const loaded = loadHomeworkDraft()
  assert.equal(loaded.title, 'Bài luyện tập')
  assert.equal(loaded.instructions, 'Làm các câu trong đề')
  assert.deepEqual(loaded.classIds, [7])
  assert.equal(loaded.file, attachment)

  clearHomeworkDraft()
  assert.equal(loadHomeworkDraft(), null)
  delete globalThis.localStorage
})
