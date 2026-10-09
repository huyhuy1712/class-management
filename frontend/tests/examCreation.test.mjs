import { distributeQuestionScore } from '../src/pages/teacher/exams/builder/helpers/examScoreDistribution.js'
import { getGroupScore, getQuestionScore, migrateDraftScores } from '../src/pages/teacher/exams/builder/helpers/examScoreUtils.js'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { File } from 'node:buffer'
import { buildExamPayload, getExamConfig, orderExamSections } from '../src/pages/teacher/exams/builder/helpers/examPayload.js'
import { validateExamBuilder } from '../src/pages/teacher/exams/builder/helpers/examBuilderValidation.js'
import { isUncertainExamSave, mapExamApiErrors } from '../src/pages/teacher/exams/builder/helpers/examApiErrors.js'
import { uploadExamMedia, validateExamMedia } from '../src/pages/teacher/exams/builder/helpers/examMediaUpload.js'
import { clearExamDraft, loadExamDraft, saveExamDraft } from '../src/pages/teacher/exams/draft/examDraftStorage.js'

const config = { title: 'Đề thử', subjectId: '1', gradeLevel: '10', timeLimit: '60', maxAttempts: '0', scoreVisibility: 'AFTER_EXAM', answerVisibility: 'AFTER_SUBMIT', hideWrongAnswers: true, accessType: 'ALL', classIds: [1], studentIds: [10] }
const item = (id, correct = false) => ({ id, content: `Ý ${id}`, isCorrect: correct, point: 0.5, orderIndex: 1 })
const group = (id = 'g') => ({ id, answerType: 'TRUE_FALSE', point: 1, orderIndex: 1, answers: [item('a'), item('b')], scoringRules: [] })
const sections = () => [{ id: 's', title: 'Phần 1', orderIndex: 1, questions: [{ id: 'q', content: 'Câu hỏi', point: 1, orderIndex: 1, answerGroups: [group()] }] }]

test('ALL never sends class or student targets', () => {
  assert.deepEqual(buildExamPayload(config, sections()).assignment, {
    assignmentType: 'ALL', openTime: null, closeTime: null, classIds: [], studentIds: [], scoreVisibility: 'AFTER_EXAM', answerVisibility: 'AFTER_SUBMIT', hideCorrectAnswerOnWrong: true,
  })
})

test('CLASS converts/deduplicates IDs and excludes students', () => {
  const assignment = buildExamPayload({ ...config, accessType: 'CLASS', classIds: ['2', 2, 3] }, sections()).assignment
  assert.deepEqual(assignment.classIds, [2, 3])
  assert.deepEqual(assignment.studentIds, [])
})

test('STUDENT retains selected students across classes without sending browsing class', () => {
  const draft = { general: { form: config, accessType: 'STUDENT', selectedClasses: [1], selectedStudents: ['10', 20], selectedStudentClassId: 1 } }
  const assignment = buildExamPayload(getExamConfig(draft, { ...config, accessType: 'CLASS' }), sections()).assignment
  assert.deepEqual(assignment.studentIds, [10, 20])
  assert.deepEqual(assignment.classIds, [])
})

test('payload excludes temporary IDs, orderIndex, binary files and maxScore', () => {
  const tree = sections()
  tree[0].imageFile = { name: 'unuploaded.png' }
  tree[0].imageMedia = { mediaId: 'uploaded-image', path: '/private/path', url: '/preview' }
  const payload = buildExamPayload({ ...config, maxScore: 100 }, tree, 'draft-token')
  const json = JSON.stringify(payload)
  assert.equal(payload.sections[0].imageMediaId, 'uploaded-image')
  for (const key of ['orderIndex', 'imageFile', 'maxScore', 'teacherId', 'private/path', 'isCorrect":null']) assert.equal(json.includes(key), false)
  assert.equal(payload.basicInfo.maxAttempts, 0)
})

test('maps all supported answer kinds and ignores unused option points/rules', () => {
  const tree = sections()
  const question = tree[0].questions[0]
  question.answerGroups = [
    { ...group('single'), answerType: 'CHOICE', choiceMode: 'SINGLE' },
    { ...group('multiple'), answerType: 'CHOICE', choiceMode: 'MULTIPLE' },
    { ...group('short'), answerType: 'SHORT_ANSWER', answers: [item('short')] },
    { ...group('essay'), answerType: 'TEXT', answers: [item('essay')] },
  ]
  const answers = buildExamPayload(config, tree).sections[0].questions[0].answers
  assert.deepEqual(answers.map((answer) => answer.answerType), ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY'])
  assert.equal('points' in answers[0].options[0], false)
  assert.equal(answers[2].correctAnswerText, 'Ý short')
  assert.equal('options' in answers[2], false)
  assert.equal('correctAnswerText' in answers[3], false)
})

test('all false, all true and mixed TRUE_FALSE answers are valid', () => {
  for (const values of [[false, false], [true, true], [true, false]]) {
    const tree = sections()
    tree[0].questions[0].answerGroups[0].answers.forEach((answer, index) => { answer.isCorrect = values[index] })
    assert.equal(validateExamBuilder(tree).isValid, true)
  }
})

test('derives decimal totals and ignores obsolete manually entered totals', () => {
  const tree = sections()
  const question = tree[0].questions[0]
  question.point = 0.3
  question.answerGroups[0].point = 0.3
  question.answerGroups[0].answers[0].point = 0.1
  question.answerGroups[0].answers[1].point = 0.2
  assert.equal(validateExamBuilder(tree).isValid, true)
  question.point = 1
  assert.equal(validateExamBuilder(tree).isValid, true)
  assert.equal(getQuestionScore(question), 0.3)
  assert.equal(buildExamPayload(config, tree).sections[0].questions[0].points, 0.3)
  question.answerGroups[0].answers[0].point = 0.001
  assert.ok(validateExamBuilder(tree).errors['answer-group-g'])
})

test('CORRECT_COUNT requires complete monotonic rules with correct endpoints', () => {
  const tree = sections()
  const answerGroup = tree[0].questions[0].answerGroups[0]
  answerGroup.scoreByCorrectCount = true
  answerGroup.scoringRules = [{ correctCount: 0, point: 0 }, { correctCount: 1, point: 0.25 }, { correctCount: 2, point: 1 }]
  assert.equal(validateExamBuilder(tree).isValid, true)
  const payloadGroup = buildExamPayload(config, tree).sections[0].questions[0].answers[0]
  assert.equal(payloadGroup.scoringType, 'CORRECT_COUNT')
  assert.equal('points' in payloadGroup.options[0], false)
  assert.equal(payloadGroup.scoringRules[1].score, 0.25)
  answerGroup.scoringRules.pop()
  assert.ok(validateExamBuilder(tree).errors['answer-group-g'])
})

test('sorts payload and maps BE paths back to stable IDs after ordering', () => {
  const tree = sections()
  tree.push({ ...sections()[0], id: 'first', orderIndex: 0 })
  const ordered = orderExamSections(tree)
  assert.equal(ordered[0].id, 'first')
  const mapped = mapExamApiErrors({
    'sections[1].questions[0].points': 'Điểm câu sai',
    'sections[1].questions[0].answers[0].options[1].content': 'Ý sai',
    'basicInfo.title': 'Tên sai', 'assignment.studentIds': 'Học sinh sai',
  }, ordered)
  assert.equal(mapped.errors['question-q'], 'Điểm câu sai')
  assert.equal(mapped.errors['answer-group-g'], 'Ý sai')
  assert.deepEqual(mapped.configErrors, { title: 'Tên sai', accessType: 'Học sinh sai' })
  assert.equal(tree[0].id, 's')
})

test('unknown POST result locks retries; known validation failures may be corrected', () => {
  for (const status of [undefined, 408, 500, 502]) assert.equal(isUncertainExamSave({ response: status ? { status } : undefined }, true), true)
  for (const status of [400, 403, 404, 409, 413]) assert.equal(isUncertainExamSave({ response: { status } }, true), false)
  assert.equal(isUncertainExamSave({}, false), false)
})

test('successful uploads remain available after a later upload failure without duplicate upload', async () => {
  const tree = sections()
  tree[0].imageFile = { name: 'image.png', type: 'image/png', size: 10 }
  tree[0].audioFile = { name: 'audio.mp3', type: 'audio/mpeg', size: 10 }
  validateExamMedia(tree)
  let progress
  let calls = 0
  await assert.rejects(uploadExamMedia(tree, 'token', (value) => { progress = value }, async () => {
    if (++calls === 2) throw new Error('Upload failed')
    return { mediaId: 'image-id', url: '/image.png' }
  }))
  assert.equal(progress[0].imageMedia.mediaId, 'image-id')
  assert.equal(progress[0].imageFile, null)
  assert.equal(tree[0].imageFile.name, 'image.png')
  let retried = 0
  const result = await uploadExamMedia(progress, 'token', () => {}, async (token, type) => {
    retried++
    assert.equal(type, 'AUDIO')
    return { mediaId: 'audio-id' }
  })
  assert.equal(retried, 1)
  assert.equal(result[0].audioMedia.mediaId, 'audio-id')
})

test('media preflight rejects unsupported audio and oversize image', () => {
  const tree = sections()
  tree[0].audioFile = { name: 'file.wav', type: 'audio/wav', size: 10 }
  assert.throws(() => validateExamMedia(tree), /MP3/)
  tree[0].audioFile = null
  tree[0].imageFile = { name: 'file.png', type: 'image/png', size: 6 * 1024 * 1024 }
  assert.throws(() => validateExamMedia(tree), /5 MiB/)
})

test('draft persists targets, upload metadata and pending save without storing binary', () => {
  const storage = new Map()
  globalThis.File = File
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) }
  try {
    assert.equal(saveExamDraft({ general: { form: config, accessType: 'STUDENT', selectedStudents: [10, 20] }, pendingSave: { title: 'Đề thử' } }), true)
    const tree = sections()
    tree[0].imageFile = new File(['binary'], 'image.png', { type: 'image/png' })
    tree[0].audioMedia = { mediaId: 'audio-id' }
    saveExamDraft({ builder: { sections: tree } })
    const draft = loadExamDraft()
    assert.deepEqual(draft.general.selectedStudents, [10, 20])
    assert.equal(draft.pendingSave.title, 'Đề thử')
    assert.equal(draft.builder.sections[0].imageFile, null)
    assert.equal(draft.builder.sections[0].audioMedia.mediaId, 'audio-id')
    clearExamDraft()
    assert.equal(loadExamDraft(), null)
  } finally {
    delete globalThis.localStorage
    delete globalThis.File
  }
})


test('choice sums only correct options; text scores come from the answer item', () => {
  const choice = { answerType: 'CHOICE', point: 99, answers: [item('a', true), item('b', false)] }
  choice.answers[1].point = 9
  assert.equal(getGroupScore(choice), 0.5)
  choice.answers[1].isCorrect = true
  assert.equal(getGroupScore(choice), 9.5)
  choice.answers.pop()
  assert.equal(getGroupScore(choice), 0.5)
  assert.equal(getGroupScore({ answerType: 'SHORT_ANSWER', answers: [{ point: 2 }] }), 2)
})

test('rule endpoint determines group, question and payload scores', () => {
  const tree = sections()
  const answerGroup = tree[0].questions[0].answerGroups[0]
  answerGroup.scoreByCorrectCount = true
  answerGroup.scoringRules = [{ correctCount: 0, point: 0 }, { correctCount: 1, point: 0.25 }, { correctCount: 2, point: 2 }]
  assert.equal(getGroupScore(answerGroup), 2)
  assert.equal(getQuestionScore(tree[0].questions[0]), 2)
  assert.equal(validateExamBuilder(tree).isValid, true)
  const question = buildExamPayload(config, tree).sections[0].questions[0]
  assert.equal(question.points, 2)
  assert.equal(question.answers[0].points, 2)
})


test('migrates old draft group totals without losing cents or overwriting answer scores', () => {
  const tree = sections()
  const oldGroup = tree[0].questions[0].answerGroups[0]
  oldGroup.answerType = 'CHOICE'
  oldGroup.point = 1
  oldGroup.answers = [item('a', true), item('b', true), item('c', true)]
  oldGroup.answers.forEach((answer) => { answer.point = 0 })
  const migrated = migrateDraftScores(tree)[0].questions[0].answerGroups[0]
  assert.deepEqual(migrated.answers.map((answer) => answer.point), [0.33, 0.33, 0.34])
  assert.equal(getGroupScore(migrated), 1)
  assert.equal('point' in migrated, false)
  assert.deepEqual(migrateDraftScores(migrateDraftScores(tree)), migrateDraftScores(tree))
  oldGroup.answers[0].point = 2
  assert.equal(getGroupScore(migrateDraftScores(tree)[0].questions[0].answerGroups[0]), 2)
})


test('sidebar score distributes exact cents and preserves relative item scores', () => {
  const question = sections()[0].questions[0]
  question.answerGroups[0].answers[0].point = 1
  question.answerGroups[0].answers[1].point = 2
  const updated = distributeQuestionScore(question, '1')
  assert.equal(getQuestionScore(updated), 1)
  assert.deepEqual(updated.answerGroups[0].answers.map((answer) => answer.point), [0.33, 0.67])
  assert.equal(getQuestionScore(distributeQuestionScore(updated, '0')), 0)
  assert.equal(getQuestionScore(distributeQuestionScore(distributeQuestionScore(updated, '0'), '1')), 1)
})

test('sidebar scales count rules and keeps payload totals consistent', () => {
  const tree = sections()
  const question = tree[0].questions[0]
  question.answerGroups[0].scoreByCorrectCount = true
  question.answerGroups[0].scoringRules = [{ correctCount: 0, point: 0 }, { correctCount: 1, point: 0.25 }, { correctCount: 2, point: 1 }]
  tree[0].questions[0] = distributeQuestionScore(question, '2')
  assert.deepEqual(tree[0].questions[0].answerGroups[0].scoringRules.map((rule) => rule.point), [0, 0.5, 2])
  assert.equal(validateExamBuilder(tree).isValid, true)
  const payloadQuestion = buildExamPayload(config, tree).sections[0].questions[0]
  assert.equal(payloadQuestion.points, 2)
  assert.equal(payloadQuestion.answers[0].points, 2)
})


test('CHOICE accepts one or many correct options and rejects zero correct options', () => {
  for (const flags of [[true, false], [true, true], [false, false]]) {
    const tree = sections()
    const answerGroup = tree[0].questions[0].answerGroups[0]
    answerGroup.answerType = 'CHOICE'
    answerGroup.choiceMode = 'MULTIPLE'
    answerGroup.answers.forEach((answer, index) => { answer.isCorrect = flags[index] })
    const result = validateExamBuilder(tree)
    assert.equal(result.isValid, flags.some(Boolean))
    if (!flags.some(Boolean)) assert.ok(result.errors['answer-group-g'])
    assert.equal(buildExamPayload(config, tree).sections[0].questions[0].answers[0].answerType, 'MULTIPLE_CHOICE')
  }
})


test('SINGLE choice rejects multiple correct options while MULTIPLE accepts them', () => {
  const tree = sections()
  const answer = tree[0].questions[0].answerGroups[0]
  answer.answerType = 'CHOICE'
  answer.choiceMode = 'SINGLE'
  answer.answers.forEach((item) => { item.isCorrect = true })
  assert.ok(validateExamBuilder(tree).errors['answer-group-g'])
  answer.answers[1].isCorrect = false
  assert.equal(validateExamBuilder(tree).isValid, true)
  assert.equal(buildExamPayload(config, tree).sections[0].questions[0].answers[0].answerType, 'SINGLE_CHOICE')
  answer.choiceMode = 'MULTIPLE'
  answer.answers[1].isCorrect = true
  assert.equal(validateExamBuilder(tree).isValid, true)
})

test('optional section paragraph is included in create payload', () => {
  const content = sections()
  assert.equal(buildExamPayload(config, content).sections[0].paragraph, null)
  content[0].paragraph = ' Đoạn đọc chung\nDòng thứ hai '
  assert.equal(buildExamPayload(config, content).sections[0].paragraph, 'Đoạn đọc chung\nDòng thứ hai')
})
