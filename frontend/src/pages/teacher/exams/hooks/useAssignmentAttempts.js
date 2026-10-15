import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { resourceOptions } from '../../../../query/resourceOptions'
import useResourceQuery from '../../../../query/useResourceQuery'
import { getSessionVersion } from '../../../../query/queryClient'
import examService from '../../../../services/examService'
import useAuthStore from '../../../../stores/authStore'
import { accountScope } from '../../../../query/queryKeys'
import { canComment, patchAttemptPage, rollbackAttemptComment } from '../helpers/assignmentAttemptHelpers'

export default function useAssignmentAttempts(assignmentId, classId, filters) {
  const queryClient = useQueryClient()
  const version = getSessionVersion()
  const account = accountScope(useAuthStore((state) => state.user), version)
  const lock = useRef(false)
  const [search, setSearch] = useState(filters.q)
  useEffect(() => { const timer = setTimeout(() => setSearch(filters.q), 300); return () => clearTimeout(timer) }, [filters.q])
  const params = [assignmentId, classId, filters.page, 12, search, filters.status, filters.sort]
  const query = useResourceQuery('teacherAssignmentAttempts', params, {
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[3] === String(assignmentId)
      && previousQuery?.queryKey[4] === String(classId) && previousQuery?.queryKey[1] === account ? previous : undefined,
  })
  const prefix = query.queryKey.slice(0, 4)
  const mutation = useMutation({
    mutationFn: ({ item, comment, sessionVersion }) => {
      if (sessionVersion !== getSessionVersion() || !canComment(item)) throw new Error('Bài làm không còn khả dụng.')
      return examService.updateAttemptGrades(item.attemptId, { attemptNumber: item.attemptNumber, revision: item.revision, teacherComment: comment })
    },
    onMutate: async ({ item, comment, sessionVersion, scopePrefix }) => {
      await queryClient.cancelQueries({ queryKey: scopePrefix })
      if (sessionVersion !== getSessionVersion()) return []
      const snapshots = queryClient.getQueriesData({ queryKey: scopePrefix }).map(([key, page]) => ({ key,
        previous: page?.items.find((row) => row.attemptId === item.attemptId)?.teacherComment }))
      queryClient.setQueriesData({ queryKey: scopePrefix }, (page) => patchAttemptPage(page, item.attemptId, { teacherComment: comment || null }))
      return snapshots
    },
    onError: (_, { item, comment, sessionVersion }, snapshots) => {
      if (sessionVersion !== getSessionVersion()) return
      snapshots?.forEach(({ key, previous }) => queryClient.setQueryData(key,
        (page) => rollbackAttemptComment(page, item.attemptId, comment || null, previous)))
    },
    onSuccess: (result, { item, sessionVersion, scopePrefix }) => {
      if (sessionVersion !== getSessionVersion()) return
      queryClient.setQueriesData({ queryKey: scopePrefix }, (page) => patchAttemptPage(page, item.attemptId, {
        teacherComment: result.teacherComment, revision: result.revision,
      }))
    },
    onSettled: (_, __, { sessionVersion, scopePrefix }) => { if (sessionVersion === getSessionVersion()) void queryClient.invalidateQueries({ queryKey: scopePrefix }) },
  })
  const saveComment = async (item, text) => {
    if (lock.current) return false
    if (text.length > 20000) throw new Error('Nhận xét tối đa 20.000 ký tự.')
    lock.current = true
    try { await mutation.mutateAsync({ item, comment: text.trim(), sessionVersion: version, scopePrefix: prefix }); return version === getSessionVersion() }
    finally { lock.current = false }
  }
  const prefetchNext = () => {
    const nextParams = [...params]; nextParams[2] += 1
    const nextKey = [...query.queryKey]; nextKey[5] = String(nextParams[2])
    void queryClient.prefetchQuery({ ...resourceOptions('teacherAssignmentAttempts', nextParams), queryKey: nextKey })
  }
  return { query, saveComment, saving: mutation.isPending, prefetchNext }
}
