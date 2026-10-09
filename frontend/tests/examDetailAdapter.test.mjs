import test from 'node:test'
import assert from 'node:assert/strict'
import { toExamBuilder } from '../src/pages/teacher/exams/helpers/examDetailAdapter.js'
import { getExamScore } from '../src/pages/teacher/exams/builder/helpers/examScoreUtils.js'

test('detail maps nested basic info, types, score rules and media into builder', () => {
  const media = { mediaId: 'image', url: 'https://example.com/image.png' }
  const detail = { id: 1, basicInfo: { title: 'Đề thật', subjectId: 2 }, assignments: [{ assignmentType: 'CLASS', classIds: [21], openTime: '2026-10-09T08:00:00' }], sections: [{ id: 1, orderIndex: 1, imageMedia: media, questions: [{ id: 2, answers: [
    { id: 3, orderIndex: 1, answerType: 'MULTIPLE_CHOICE', points: 1, options: [1, 2, 3].map((id) => ({ id, isCorrect: true, imageMedia: media })) },
    { id: 4, orderIndex: 2, answerType: 'SHORT_ANSWER', points: 2, correctAnswerText: '42', audioMedia: media },
    { id: 5, orderIndex: 3, answerType: 'ESSAY', points: 3, content: 'Bài giải' },
    { id: 6, orderIndex: 4, answerType: 'TRUE_FALSE', scoringType: 'CORRECT_COUNT', options: [{ id: 7, isCorrect: false }], scoringRules: [{ id: 8, correctCount: 1, score: 4 }] },
  ] }] }] }
  const result = toExamBuilder(detail)
  assert.equal(result.title, 'Đề thật')
  assert.equal(result.openTime, detail.assignments[0].openTime)
  const groups = result.sections[0].questions[0].answerGroups
  assert.equal(groups[0].choiceMode, 'MULTIPLE')
  assert.deepEqual(groups[0].answers[0].imageMedia, media)
  assert.equal(groups[1].answers[0].content, '42')
  assert.equal(groups[2].answerType, 'TEXT')
  assert.equal(groups[3].scoreByCorrectCount, true)
  assert.equal(groups[3].scoringRules[0].point, 4)
  assert.equal(getExamScore(result.sections), 10)
  assert.deepEqual(toExamBuilder({ basicInfo: {}, sections: [] }).sections, [])
})
