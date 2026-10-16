import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useResourceQuery from '../../../../query/useResourceQuery'
import useAuthStore from '../../../../stores/authStore'
import { accountScope, resourceKey } from '../../../../query/queryKeys'
import { getSessionVersion } from '../../../../query/queryClient'
import { resourceOptions } from '../../../../query/resourceOptions'

export default function useStudentGrades(filters, page) {
  const account = accountScope(useAuthStore((state) => state.user), getSessionVersion())
  const [search, setSearch] = useState(filters.search)
  useEffect(() => { const timer = setTimeout(() => setSearch(filters.search), 300); return () => clearTimeout(timer) }, [filters.search])
  const params = [filters.classroom, filters.subject, filters.from, filters.to, search, filters.status, filters.order, page]
  const query = useResourceQuery('studentGrades', params, {
    staleTime: 15_000, refetchInterval: 60_000,
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[1] === account ? previous : undefined,
  })
  const queryClient = useQueryClient()
  const prefetchNext = () => {
    const next = [...params]; next[7] = page + 1
    if (!account || query.isPlaceholderData) return
    void queryClient.prefetchQuery({ ...resourceOptions('studentGrades', next), staleTime: 15_000, queryKey: resourceKey(account, 'studentGrades', next) })
  }
  return { ...query, prefetchNext }
}
