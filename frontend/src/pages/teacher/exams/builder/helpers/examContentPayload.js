import { buildExamPayload } from './examPayload.js'

const identity = (item) => typeof item.id === 'number' ? { id: item.id } : { clientId: String(item.id) }
export function buildExamContentPayload(sections, revision, draftToken) {
  const content = buildExamPayload({}, sections).sections
  return {
    revision, draftToken,
    sections: content.map((section, i) => ({
      ...section, ...identity(sections[i]),
      questions: section.questions.map((question, j) => ({
        ...question, ...identity(sections[i].questions[j]),
        answers: question.answers.map((answer, k) => {
          const group = sections[i].questions[j].answerGroups[k]
          return {
            ...answer, ...identity(group), caseSensitive: group.caseSensitive,
            ...(answer.options ? { options: answer.options.map((option, n) => ({ ...option, ...identity(group.answers[n]) })) } : {}),
            ...(answer.scoringRules ? { scoringRules: answer.scoringRules.map((rule, n) => ({ ...rule, ...identity(group.scoringRules[n]) })) } : {}),
          }
        }),
      })),
    })),
  }
}
export function applyContentIdMappings(sections, mappings = {}) {
  const map = (type, item) => ({ ...item, id: mappings[type]?.find((entry) => entry.clientId === String(item.id))?.id ?? item.id })
  return sections.map((section) => ({ ...map('sections', section), questions: section.questions.map((question) => ({
    ...map('questions', question), answerGroups: question.answerGroups.map((group) => ({
      ...map('answers', group),
      answers: group.answers.map((answer) => map('options', answer)),
      scoringRules: (group.scoringRules ?? []).map((rule) => map('scoringRules', rule)),
    })),
  })) }))
}
