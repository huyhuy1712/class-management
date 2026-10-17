export const emptySubjectForm = { name: '', code: '', description: '' }

export function createSubjectForm(subject) {
  if (!subject) return { ...emptySubjectForm }

  return {
    name: subject.name,
    code: subject.code,
    description: subject.description ?? '',
  }
}

export function filterSubjects(subjects, keyword) {
  const normalizedKeyword = keyword.trim().toLowerCase()

  return subjects.filter((subject) =>
    [subject.name, subject.code, subject.description]
      .some((value) => String(value ?? '').toLowerCase().includes(normalizedKeyword))
  )
}
