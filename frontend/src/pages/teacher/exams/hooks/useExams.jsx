import useResourceQuery from '../../../../query/useResourceQuery'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSessionVersion, setSessionQueryData } from '../../../../query/queryClient'
import { resourceKey } from '../../../../query/queryKeys'
import useAuthStore from '../../../../stores/authStore'
import { useRef } from 'react'
import examService from '../../../../services/examService'

export default function useExams() {
  const query = useResourceQuery('exams', [], { errorMessage: 'Không thể tải danh sách đề thi. Vui lòng thử lại.' })
  const queryClient = useQueryClient()
  const copying = useRef(false)
  const copyMutation = useMutation({ mutationFn: ({ examId, requestId }) => examService.copyExam(examId, requestId) })
  const copyExam = async (examId) => {
    if (copying.current) return null
    copying.current = true
    const version = getSessionVersion()
    const sourceExam = query.data?.find((item) => item.id === examId)
    const requestKey = `exam-copy:${useAuthStore.getState().user?.id}:${examId}`
    try {
      const requestId = sessionStorage.getItem(requestKey) || crypto.randomUUID()
      sessionStorage.setItem(requestKey, requestId)
      const result = await copyMutation.mutateAsync({ examId, requestId })
      if (version !== getSessionVersion()) return null
      sessionStorage.removeItem(requestKey)
      setSessionQueryData(resourceKey(query.queryKey[1], 'examDetail', [result.id]), result, version)
      query.setData((current = []) => [
        {
          ...result.basicInfo,
          id: result.id,
          code: result.code,
          status: result.status,
          revision: result.revision,
          maxScore: result.maxScore,
          createdAt: result.updatedAt,
          updatedAt: result.updatedAt,
          submittedCount: 0,
          assignedTo: sourceExam?.assignedTo ?? [],
        },
        ...current.filter((item) => item.id !== result.id),
      ])
      return result
    } catch (error) {
      if (version !== getSessionVersion()) return null
      throw error
    } finally { copying.current = false }
  }
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
    unpublishExam: (id) => changePublication(id, false), publishingId: mutation.isPending ? mutation.variables?.examId : null,
    copyExam, copyingId: copyMutation.isPending ? copyMutation.variables?.examId : null }
}
