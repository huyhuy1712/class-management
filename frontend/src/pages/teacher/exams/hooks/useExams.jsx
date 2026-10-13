import useResourceQuery from '../../../../query/useResourceQuery'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSessionVersion } from '../../../../query/queryClient'
import examService from '../../../../services/examService'

export default function useExams() {
  const query = useResourceQuery('exams', [], { errorMessage: 'Không thể tải danh sách đề thi. Vui lòng thử lại.' })
  const queryClient = useQueryClient()
  const mutation = useMutation({ mutationFn: ({ examId, published }) => published
    ? examService.publishExam(examId) : examService.unpublishExam(examId) })
  const changePublication = async (examId, published) => {
    if (mutation.isPending) return null
    const version = getSessionVersion()
    try {
      const result = await mutation.mutateAsync({ examId, published })
      if (version !== getSessionVersion()) return null
      query.setData((current = []) => current.map((item) => item.id === result.id
        ? { ...item, status: result.status, revision: result.revision, updatedAt: result.updatedAt } : item))
      void queryClient.invalidateQueries({ predicate: (item) => item.queryKey[1] === query.queryKey[1]
        && ['examConfiguration', 'examDetail'].includes(item.queryKey[2])
        && item.queryKey[3] === String(result.id) })
      return result
    } catch (error) {
      if (version !== getSessionVersion()) return null
      throw error
    }
  }
  return { exams: query.data ?? [], setExams: query.setData, loading: query.isLoading, error: query.errorMessage,
    refetch: query.refetch, publishExam: (id) => changePublication(id, true),
    unpublishExam: (id) => changePublication(id, false), publishingId: mutation.isPending ? mutation.variables?.examId : null }
}
