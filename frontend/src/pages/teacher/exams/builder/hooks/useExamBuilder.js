import { useMemo, useState } from 'react'

import { createAnswer, createQuestion, createSection } from '../helpers/examBuilderConstants'
import { getExamScore } from '../helpers/examScoreUtils'

function useExamBuilder() {
  const [sections, setSections] = useState([])
  const totalScore = useMemo(() => getExamScore(sections), [sections])

  const addSection = () =>
    setSections((current) => [...current, createSection(current.length)])

  const updateSection = (sectionId, changes) =>
    setSections((current) =>
      current.map((section) => section.id === sectionId ? { ...section, ...changes } : section),
    )

  const removeSection = (sectionId) =>
    setSections((current) => current.filter((section) => section.id !== sectionId))

  const addQuestion = (sectionId) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? { ...section, questions: [...section.questions, createQuestion(section.questions.length)] }
          : section,
      ),
    )

  const updateQuestion = (sectionId, questionId, changes) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.id === questionId ? { ...question, ...changes } : question,
              ),
            }
          : section,
      ),
    )

  const removeQuestion = (sectionId, questionId) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? { ...section, questions: section.questions.filter((question) => question.id !== questionId) }
          : section,
      ),
    )

  const addAnswer = (sectionId, questionId, type) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.id === questionId
                  ? { ...question, answers: [...question.answers, createAnswer(type, question.answers.length)] }
                  : question,
              ),
            }
          : section,
      ),
    )

  const updateAnswer = (sectionId, questionId, answerId, changes) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.id === questionId
                  ? {
                      ...question,
                      answers: question.answers.map((answer) =>
                        answer.id === answerId ? { ...answer, ...changes } : answer,
                      ),
                    }
                  : question,
              ),
            }
          : section,
      ),
    )

  const removeAnswer = (sectionId, questionId, answerId) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.id === questionId
                  ? { ...question, answers: question.answers.filter((answer) => answer.id !== answerId) }
                  : question,
              ),
            }
          : section,
      ),
    )

  return {
    sections,
    totalScore,
    addSection,
    updateSection,
    removeSection,
    addQuestion,
    updateQuestion,
    removeQuestion,
    addAnswer,
    updateAnswer,
    removeAnswer,
  }
}

export default useExamBuilder
