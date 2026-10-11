import useResourceQuery from '../../../../query/useResourceQuery'

export default function useExams() {
  const query = useResourceQuery('exams', [], { errorMessage: 'Không thể tải danh sách đề thi. Vui lòng thử lại.' })
  return { exams: query.data ?? [], setExams: query.setData, loading: query.isLoading, error: query.errorMessage, refetch: query.refetch }
}
