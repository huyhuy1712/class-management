import useResourceQuery from '../../../../query/useResourceQuery'

export default function useStudentExamClasses() {
  const query = useResourceQuery('studentClasses')
  return { classes: query.data ?? [], loading: query.isLoading, error: query.errorMessage, retry: query.refetch }
}
