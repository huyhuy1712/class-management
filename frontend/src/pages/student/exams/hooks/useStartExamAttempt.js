import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import examService from '../../../../services/examService'
import { getSessionVersion, setSessionQueryData } from '../../../../query/queryClient'
import { accountScope, resourceKey } from '../../../../query/queryKeys'
import useAuthStore from '../../../../stores/authStore'

export default function useStartExamAttempt(assignmentId, assignmentQuery) {
  const navigate = useNavigate()
  const lock = useRef(false)
  const [error, setError] = useState('')
  const mutation = useMutation({ mutationFn: (body) => examService.startAttempt(assignmentId, body), retry: false })
  const start = async () => {
    if (lock.current) return
    lock.current = true
    setError('')
    const version = getSessionVersion()
    const account = accountScope(useAuthStore.getState().user, version)
    try {
      const { data } = await assignmentQuery.refetch({ throwOnError: true })
      if (version !== getSessionVersion()) return
      if (data.canResume && data.attemptId) { navigate(`/student/exam-attempts/${data.attemptId}`); return }
      if (!data.canStart) throw new Error('Hiện không thể bắt đầu lượt thi. Vui lòng kiểm tra thời gian và số lượt.')
      const key = `exam-start:${account}:${assignmentId}:${data.attemptsUsed}`
      const requestId = sessionStorage.getItem(key) || crypto.randomUUID()
      sessionStorage.setItem(key, requestId)
      const result = await mutation.mutateAsync({ requestId, expectedAttemptCount: data.attemptsUsed })
      if (version !== getSessionVersion()) return
      setSessionQueryData(resourceKey(account, 'examAttempt', [result.attemptId]), result, version)
      sessionStorage.removeItem(key)
      navigate(`/student/exam-attempts/${result.attemptId}${result.status === 'IN_PROGRESS' ? '' : '/result'}`)
    } catch (failure) { setError(failure.response?.data?.message || failure.message || 'Không thể bắt đầu bài thi.') }
    finally { lock.current = false }
  }
  return { start, pending: mutation.isPending || assignmentQuery.isFetching, error }
}
