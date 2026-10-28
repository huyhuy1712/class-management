const HOMEWORK_DRAFT_KEY = 'teacher_homework_create_draft_v1'

let memoryDraft = null

const sanitizeForStorage = (form) => ({
  ...form,
  file: null,
  audioFile: null,
})

export const loadHomeworkDraft = () => {
  let persisted = null
  try {
    const raw = localStorage.getItem(HOMEWORK_DRAFT_KEY)
    persisted = raw ? JSON.parse(raw) : null
  } catch {
    persisted = null
  }

  return memoryDraft || persisted
    ? {
        ...(persisted ?? {}),
        ...(memoryDraft ?? {}),
      }
    : null
}

export const saveHomeworkDraft = (form) => {
  memoryDraft = { ...form }
  try {
    localStorage.setItem(HOMEWORK_DRAFT_KEY, JSON.stringify({
      ...sanitizeForStorage(form),
      updatedAt: new Date().toISOString(),
    }))
    return true
  } catch (error) {
    console.warn('Could not save homework draft:', error)
    return false
  }
}

export const clearHomeworkDraft = () => {
  memoryDraft = null
  localStorage.removeItem(HOMEWORK_DRAFT_KEY)
}
