import { INITIAL_EXAM_FORM } from '../create/helpers/examFormConstants.js'

export function hasExamDraftContent(draft) {
  if (!draft || typeof draft !== 'object') return false
  if (draft.pendingSave || draft.builder?.sections?.length > 0) return true
  const general = draft.general
  if (!general) return false
  if (general.selectedClasses?.length || general.selectedStudents?.length) return true
  const form = general.form ?? {}
  return Object.entries(INITIAL_EXAM_FORM).some(([key, initial]) => {
    const value = form[key]
    if (value == null || String(value).trim() === '') return false
    return String(value).trim() !== String(initial)
  })
}
