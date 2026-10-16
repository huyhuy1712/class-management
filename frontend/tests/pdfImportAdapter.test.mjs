import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  validatePdfImport,
  pdfImportSections,
  importIllustrationTargets,
} from '../src/pages/teacher/exams/create/helpers/pdfImportAdapter.js'

const preview = {
  structure: {
    sections: [
      {
        clientId: 's',
        rawTitle: 'Phần 1',
        questions: [
          {
            clientId: 'q',
            rawStem: 'Câu hỏi',
            explanation: 'Giải thích',
            group: {
              clientId: 'g',
              answerType: 'SINGLE_CHOICE',
              options: [{ clientId: 'o', rawText: 'A', isCorrect: true }],
            },
          },
        ],
      },
    ],
  },
}

test('PDF import accepts only one positive exam number and a bounded PDF', () => {
  const file = { name: 'de.pdf', type: 'application/pdf', size: 100 }
  assert.equal(validatePdfImport(file, '2'), '')
  for (const number of ['1,2', '1-3', '0', '-1', '1.5', '']) {
    assert.ok(validatePdfImport(file, number))
  }
  assert.ok(validatePdfImport({ ...file, size: 11 * 1024 * 1024 }, '1'))
  assert.ok(validatePdfImport({ ...file, name: 'de.docx' }, '1'))
})

test('import keeps stable identities and editable content without assigning scores', () => {
  const sections = pdfImportSections(preview)
  const question = sections[0].questions[0]
  assert.equal(question.id, 'q')
  assert.equal(question.point, '')
  assert.equal(question.answerGroups[0].answers[0].point, '')
  assert.equal(question.explanation, 'Giải thích')
  assert.equal(question.answerGroups[0].answerType, 'CHOICE')
  assert.throws(() => pdfImportSections({}))
})

test('illustration mapping follows edited order and rejects deleted owners and private reference images', () => {
  const sections = pdfImportSections(preview)
  const assets = [{ id: 'a', owner: 'OPTION', ownerId: 'o', purpose: 'ILLUSTRATION' }]
  assert.deepEqual(importIllustrationTargets(sections, assets, ['a']), [
    {
      assetId: 'a',
      sectionIndex: 0,
      questionIndex: 0,
      answerIndex: 0,
      optionIndex: 0,
    },
  ])
  assert.throws(() => importIllustrationTargets([], assets, ['a']))
  assert.throws(() =>
    importIllustrationTargets(
      sections,
      [{ ...assets[0], purpose: 'SOURCE_REFERENCE' }],
      ['a']
    )
  )
})
