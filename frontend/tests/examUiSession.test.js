import test from 'node:test'
import assert from 'node:assert/strict'
import useExamUiSession from '../src/pages/teacher/exams/hooks/useExamUiSession.js'

test('UI edits merge per exam and preserve content when status changes', () => {
  useExamUiSession.setState({ exams: {} })
  const exam = { id: 1, title: 'Đề 1', status: 'DRAFT' }
  const { updateExam } = useExamUiSession.getState()
  const sections = [{ id: 'section-1', questions: [] }]
  updateExam(exam, { sections })
  updateExam(exam, { status: 'PUBLISHED' })
  updateExam({ id: 2, title: 'Đề 2' }, { title: 'Tên mới' })
  assert.equal(useExamUiSession.getState().exams[1].status, 'PUBLISHED')
  assert.deepEqual(useExamUiSession.getState().exams[1].sections, sections)
  updateExam(exam, { status: 'DRAFT' })
  assert.equal(useExamUiSession.getState().exams[1].status, 'DRAFT')
  assert.equal(useExamUiSession.getState().exams[2].title, 'Tên mới')
  assert.equal(exam.status, 'DRAFT')
  assert.equal(exam.sections, undefined)
})
