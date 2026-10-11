import useResourceQuery from '../../../../query/useResourceQuery'

export default function useExamResource(examId, type) {
  const query = useResourceQuery(type === 'configuration' ? 'examConfiguration' : 'examDetail', [examId], { enabled: Boolean(examId) })
  return { data: query.data, loading: query.isPending, error: query.errorMessage, retry: query.refetch }
}
