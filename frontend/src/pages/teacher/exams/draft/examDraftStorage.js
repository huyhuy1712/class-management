const EXAM_DRAFT_KEY = 'teacher_exam_create_draft_v1'

const sanitizeForStorage = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeForStorage)
  if (!value || typeof value !== 'object') return value
  if (typeof File !== 'undefined' && value instanceof File) return null

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key.endsWith('File') ? null : sanitizeForStorage(item),
    ]),
  )
}

export const loadExamDraft = () => {
  try {
    const raw = localStorage.getItem(EXAM_DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const saveExamDraft = (changes) => {
  try {
    const current = loadExamDraft() ?? {}
    localStorage.setItem(EXAM_DRAFT_KEY, JSON.stringify({
      ...current,
      ...sanitizeForStorage(changes),
      updatedAt: new Date().toISOString(),
    }))
    return true
  } catch (error) {
    console.warn('Could not save exam draft:', error)
    return false
  }
}

export const clearExamDraft = () => localStorage.removeItem(EXAM_DRAFT_KEY)
