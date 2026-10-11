import useResourceQuery from '../../../query/useResourceQuery'

export default function useProfileActivity(student) {
  const query = useResourceQuery(student ? 'studentClasses' : 'teacherClasses')
  const exams = useResourceQuery('examCount', [], { enabled: student })
  const classes = student ? (query.data ?? []).filter((item) => item.status === 'ACTIVE') : query.data ?? []
  return { classes, classCount: query.data ? classes.length : null, classCountError: Boolean(query.errorMessage), completedExamCount: exams.data?.completedExamCount ?? null, examCountError: Boolean(exams.errorMessage) }
}
