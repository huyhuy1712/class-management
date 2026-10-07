import { useMemo, useState } from 'react'
import { createAnswer, createAnswerGroup, createQuestion, createSection } from '../helpers/examBuilderConstants'
import { getExamScore } from '../helpers/examScoreUtils'

function useExamBuilder() {
  const [sections, setSections] = useState([])
  const totalScore = useMemo(() => getExamScore(sections), [sections])
  const mapQuestion = (sectionId, questionId, updater) => setSections((current) => current.map((section) => section.id !== sectionId ? section : ({ ...section, questions: section.questions.map((q) => q.id === questionId ? updater(q) : q) })))
  const mapGroup = (sectionId, questionId, groupId, updater) => mapQuestion(sectionId, questionId, (q) => ({ ...q, answerGroups: q.answerGroups.map((g) => g.id === groupId ? updater(g) : g) }))

  const addSection = () => setSections((c) => [...c, createSection(c.length)])
  const updateSection = (id, changes) => setSections((c) => c.map((s) => s.id === id ? { ...s, ...changes } : s))
  const removeSection = (id) => setSections((c) => c.filter((s) => s.id !== id))
  const addQuestion = (sectionId) => setSections((c) => c.map((s) => s.id === sectionId ? { ...s, questions: [...s.questions, createQuestion(s.questions.length)] } : s))
  const updateQuestion = (sectionId, questionId, changes) => mapQuestion(sectionId, questionId, (q) => ({ ...q, ...changes }))
  const removeQuestion = (sectionId, questionId) => setSections((c) => c.map((s) => s.id === sectionId ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) } : s))

  const addAnswerGroup = (sectionId, questionId) => mapQuestion(sectionId, questionId, (q) => ({ ...q, answerGroups: [...q.answerGroups, createAnswerGroup(q.answerGroups.length)] }))
  const removeAnswerGroup = (sectionId, questionId, groupId) => mapQuestion(sectionId, questionId, (q) => ({ ...q, answerGroups: q.answerGroups.filter((g) => g.id !== groupId) }))
  const setAnswerGroupType = (sectionId, questionId, groupId, type) => mapGroup(sectionId, questionId, groupId, (g) => {
    if (!type) return { ...g, answerType: null, answers: [] }
    if (type === 'TRUE_FALSE') return { ...g, answerType: type, answers: [createAnswer(type, 0), createAnswer(type, 1)] }
    if (type === 'CHOICE') return { ...g, answerType: type, choiceMode: 'SINGLE', answers: [] }
    return { ...g, answerType: type, answers: [createAnswer(type, 0)] }
  })
  const setGroupChoiceCount = (sectionId, questionId, groupId, count) => mapGroup(sectionId, questionId, groupId, (g) => {
    const size = Math.max(0, Math.min(50, Number(count) || 0))
    return { ...g, answers: Array.from({ length: size }, (_, i) => g.answers[i] ?? createAnswer('CHOICE', i)).map((a, i) => ({ ...a, orderIndex: i + 1 })) }
  })
  const setGroupChoiceMode = (sectionId, questionId, groupId, mode) => mapGroup(sectionId, questionId, groupId, (g) => {
    const firstCorrect = g.answers.findIndex((a) => a.isCorrect)
    return { ...g, choiceMode: mode, answers: mode === 'SINGLE' ? g.answers.map((a, i) => ({ ...a, isCorrect: i === firstCorrect && a.isCorrect })) : g.answers }
  })
  const addGroupChoice = (sectionId, questionId, groupId) => mapGroup(sectionId, questionId, groupId, (g) => ({ ...g, answers: [...g.answers, createAnswer('CHOICE', g.answers.length)] }))
  const updateGroupAnswer = (sectionId, questionId, groupId, answerId, changes) => mapGroup(sectionId, questionId, groupId, (g) => ({
    ...g, answers: g.answers.map((a) => changes.isCorrect === true && g.answerType === 'CHOICE' && g.choiceMode === 'SINGLE' ? { ...a, isCorrect: a.id === answerId } : a.id === answerId ? { ...a, ...changes } : a),
  }))
  const removeGroupAnswer = (sectionId, questionId, groupId, answerId) => mapGroup(sectionId, questionId, groupId, (g) => ({ ...g, answers: g.answers.filter((a) => a.id !== answerId) }))

  return { sections, totalScore, addSection, updateSection, removeSection, addQuestion, updateQuestion, removeQuestion, addAnswerGroup, removeAnswerGroup, setAnswerGroupType, setGroupChoiceCount, setGroupChoiceMode, addGroupChoice, updateGroupAnswer, removeGroupAnswer }
}
export default useExamBuilder
