import { useMemo, useState } from 'react'

import { createAnswer, createQuestion, createSection } from '../helpers/examBuilderConstants'
import { getExamScore } from '../helpers/examScoreUtils'

function useExamBuilder() {
  const [sections, setSections] = useState([])
  const totalScore = useMemo(() => getExamScore(sections), [sections])

  const addSection = () => setSections((current) => [...current, createSection(current.length)])
  const updateSection = (sectionId, changes) => setSections((current) => current.map((section) => section.id === sectionId ? { ...section, ...changes } : section))
  const removeSection = (sectionId) => setSections((current) => current.filter((section) => section.id !== sectionId))

  const addQuestion = (sectionId) => setSections((current) => current.map((section) => section.id === sectionId ? { ...section, questions: [...section.questions, createQuestion(section.questions.length)] } : section))
  const updateQuestion = (sectionId, questionId, changes) => setSections((current) => current.map((section) => section.id === sectionId ? { ...section, questions: section.questions.map((question) => question.id === questionId ? { ...question, ...changes } : question) } : section))
  const removeQuestion = (sectionId, questionId) => setSections((current) => current.map((section) => section.id === sectionId ? { ...section, questions: section.questions.filter((question) => question.id !== questionId) } : section))

  const setAnswerType = (sectionId, questionId, type) => setSections((current) => current.map((section) => section.id !== sectionId ? section : {
    ...section,
    questions: section.questions.map((question) => {
      if (question.id !== questionId) return question
      if (type === 'CHOICE') return { ...question, answerMode: type, choiceMode: 'SINGLE', answers: [] }
      if (type === 'TRUE_FALSE') return { ...question, answerMode: type, answers: [createAnswer('TRUE_FALSE', 0), createAnswer('TRUE_FALSE', 1)] }
      return { ...question, answerMode: type, answers: [createAnswer(type, 0)] }
    }),
  }))

  const setChoiceCount = (sectionId, questionId, count) => setSections((current) => current.map((section) => section.id !== sectionId ? section : {
    ...section,
    questions: section.questions.map((question) => {
      if (question.id !== questionId) return question
      const size = Math.max(0, Math.min(50, Number(count) || 0))
      const answers = Array.from({ length: size }, (_, index) => question.answers[index] ?? createAnswer('CHOICE', index))
      return { ...question, answers: answers.map((answer, index) => ({ ...answer, orderIndex: index + 1 })) }
    }),
  }))

  const setChoiceMode = (sectionId, questionId, mode) => setSections((current) => current.map((section) => section.id !== sectionId ? section : {
    ...section,
    questions: section.questions.map((question) => question.id === questionId ? {
      ...question,
      choiceMode: mode,
      answers: mode === 'SINGLE' ? question.answers.map((answer, index) => ({ ...answer, isCorrect: index === question.answers.findIndex((item) => item.isCorrect) && answer.isCorrect })) : question.answers,
    } : question),
  }))

  const updateAnswer = (sectionId, questionId, answerId, changes) => setSections((current) => current.map((section) => section.id !== sectionId ? section : {
    ...section,
    questions: section.questions.map((question) => {
      if (question.id !== questionId) return question
      const answers = question.answers.map((answer) => {
        if (changes.isCorrect === true && question.answerMode === 'CHOICE' && question.choiceMode === 'SINGLE') return { ...answer, isCorrect: answer.id === answerId }
        return answer.id === answerId ? { ...answer, ...changes } : answer
      })
      return { ...question, answers }
    }),
  }))

  const addAnswer = (sectionId, questionId) => setSections((current) => current.map((section) => section.id === sectionId ? {
    ...section,
    questions: section.questions.map((question) => question.id === questionId ? {
      ...question,
      answers: [...question.answers, createAnswer(question.answerMode, question.answers.length)],
    } : question),
  } : section))

  const removeAnswer = (sectionId, questionId, answerId) => setSections((current) => current.map((section) => section.id === sectionId ? { ...section, questions: section.questions.map((question) => question.id === questionId ? { ...question, answers: question.answers.filter((answer) => answer.id !== answerId) } : question) } : section))

  return { sections, totalScore, addSection, updateSection, removeSection, addQuestion, updateQuestion, removeQuestion, setAnswerType, setChoiceCount, setChoiceMode, addAnswer, updateAnswer, removeAnswer }
}
export default useExamBuilder
