import useResourceQuery from '../../../query/useResourceQuery'

export default function useTeacherExamCount(enabled = true) {
  const query = useResourceQuery('exams', [], { enabled })
  return query.errorMessage ? '--' : query.data ? new Set(query.data.map((exam) => exam.id).filter((id) => id != null)).size : '...'
}
