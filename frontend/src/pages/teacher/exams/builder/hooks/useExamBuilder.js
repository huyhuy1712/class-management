import { useEffect, useMemo, useState } from 'react'
import { loadExamDraft, saveExamDraft } from '../../draft/examDraftStorage'
import { createAnswer, createAnswerGroup, createQuestion, createScoringRule, createSection } from '../helpers/examBuilderConstants'
import { getExamScore } from '../helpers/examScoreUtils'

const withMediaChanges = (changes) => ({
  ...changes,
  ...('imageFile' in changes ? { imageMedia: null } : {}),
  ...('audioFile' in changes ? { audioMedia: null } : {}),
})

function useExamBuilder() {
  const [sections, setSections] = useState(() => loadExamDraft()?.builder?.sections ?? [])
  useEffect(() => { saveExamDraft({ builder: { sections } }) }, [sections])
  const totalScore = useMemo(() => getExamScore(sections), [sections])
  const mapQuestion = (sectionId, questionId, updater) => setSections((current) => current.map((section) => section.id !== sectionId ? section : ({ ...section, questions: section.questions.map((q) => q.id === questionId ? updater(q) : q) })))
  const mapGroup = (sectionId, questionId, groupId, updater) => mapQuestion(sectionId, questionId, (q) => ({ ...q, answerGroups: q.answerGroups.map((g) => g.id === groupId ? updater(g) : g) }))

  const addSection = () => setSections((c) => [...c, createSection(c.length)])
  const updateSection = (id, changes) => setSections((c) => c.map((s) => s.id === id ? { ...s, ...withMediaChanges(changes) } : s))
  const removeSection = (id) => setSections((c) => c.filter((s) => s.id !== id))
  const addQuestion = (sectionId) => setSections((c) => c.map((s) => s.id === sectionId ? { ...s, questions: [...s.questions, createQuestion(s.questions.length)] } : s))
  const updateQuestion = (sectionId, questionId, changes) => mapQuestion(sectionId, questionId, (q) => ({ ...q, ...withMediaChanges(changes) }))
  const removeQuestion = (sectionId, questionId) => setSections((c) => c.map((s) => s.id === sectionId ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) } : s))

  const addAnswerGroup = (sectionId, questionId) => mapQuestion(sectionId, questionId, (q) => ({ ...q, answerGroups: [...q.answerGroups, createAnswerGroup(q.answerGroups.length)] }))
  const removeAnswerGroup = (sectionId, questionId, groupId) => mapQuestion(sectionId, questionId, (q) => ({ ...q, answerGroups: q.answerGroups.filter((g) => g.id !== groupId) }))
  const setAnswerGroupType = (sectionId, questionId, groupId, type) => mapGroup(sectionId, questionId, groupId, (g) => {
    const reset = { ...g, scoreByCorrectCount: false, scoringRules: [] }
    if (!type) return { ...reset, answerType: null, answers: [] }
    if (type === 'TRUE_FALSE') return { ...reset, answerType: type, choiceMode: 'MULTIPLE', answers: [] }
    if (type === 'CHOICE') return { ...reset, answerType: type, choiceMode: 'SINGLE', answers: [] }
    return { ...reset, answerType: type, answers: [createAnswer(type, 0)] }
  })
  const setGroupChoiceCount = (sectionId, questionId, groupId, count) => mapGroup(sectionId, questionId, groupId, (g) => {
    const size = Math.max(0, Math.min(50, Number(count) || 0))
    return { ...g, answers: Array.from({ length: size }, (_, i) => g.answers[i] ?? createAnswer(g.answerType, i)).map((a, i) => ({ ...a, orderIndex: i + 1 })) }
  })
  const setGroupChoiceMode = (sectionId, questionId, groupId, mode) => mapGroup(sectionId, questionId, groupId, (g) => {
    const firstCorrect = g.answers.findIndex((a) => a.isCorrect)
    return { ...g, choiceMode: mode, answers: mode === 'SINGLE' ? g.answers.map((a, i) => ({ ...a, isCorrect: i === firstCorrect && a.isCorrect })) : g.answers }
  })
  const addGroupChoice = (sectionId, questionId, groupId) => mapGroup(sectionId, questionId, groupId, (g) => ({ ...g, answers: [...g.answers, createAnswer(g.answerType, g.answers.length)] }))
  const updateGroupAnswer = (sectionId, questionId, groupId, answerId, changes) => mapGroup(sectionId, questionId, groupId, (g) => ({
    ...g, answers: g.answers.map((a) => changes.isCorrect === true && g.answerType === 'CHOICE' && g.choiceMode === 'SINGLE' ? { ...a, isCorrect: a.id === answerId } : a.id === answerId ? { ...a, ...withMediaChanges(changes) } : a),
  }))
  const updateAnswerGroup = (sectionId, questionId, groupId, changes) => mapGroup(sectionId, questionId, groupId, (g) => ({ ...g, ...changes }))
  const addScoringRule = (sectionId, questionId, groupId) => mapGroup(sectionId, questionId, groupId, (g) => ({ ...g, scoringRules: [...(g.scoringRules ?? []), createScoringRule()] }))
  const updateScoringRule = (sectionId, questionId, groupId, ruleId, changes) => mapGroup(sectionId, questionId, groupId, (g) => ({ ...g, scoringRules: (g.scoringRules ?? []).map((rule) => rule.id === ruleId ? { ...rule, ...changes } : rule) }))
  const removeScoringRule = (sectionId, questionId, groupId, ruleId) => mapGroup(sectionId, questionId, groupId, (g) => ({ ...g, scoringRules: (g.scoringRules ?? []).filter((rule) => rule.id !== ruleId) }))

  const removeGroupAnswer = (sectionId, questionId, groupId, answerId) => mapGroup(sectionId, questionId, groupId, (g) => ({ ...g, answers: g.answers.filter((a) => a.id !== answerId) }))

  return { sections, replaceSections: setSections, totalScore, addSection, updateSection, removeSection, addQuestion, updateQuestion, removeQuestion, addAnswerGroup, removeAnswerGroup, setAnswerGroupType, setGroupChoiceCount, setGroupChoiceMode, addGroupChoice, updateGroupAnswer, removeGroupAnswer, updateAnswerGroup, addScoringRule, updateScoringRule, removeScoringRule }
}
export default useExamBuilder
