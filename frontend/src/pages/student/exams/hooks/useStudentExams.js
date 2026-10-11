import { accountScope, resourceKey, EMPTY_LIST } from '../../../../query/queryKeys'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '../../../../stores/authStore'
import { getSessionVersion } from '../../../../query/queryClient'
import { filterStudentExams, getExamStatus } from '../helpers/studentExamHelpers'

export default function useStudentExams(loadExams, preview = false) {
  const user = useAuthStore((state) => state.user)
  const account = accountScope(user, getSessionVersion())
  const query = useQuery({ queryKey: resourceKey(account, 'studentExams', [preview ? 'preview' : 'assigned']), enabled: Boolean(account && loadExams), queryFn: async ({ signal }) => {
    const data = await loadExams({ signal })
    if (!Array.isArray(data)) throw new Error('Invalid student exam response')
    return data
  } })
  const items = query.data ?? EMPTY_LIST
  const [filters, setFilters] = useState({ search: '', classId: '', date: '', order: 'NEWEST' })
  const counts = useMemo(() => items.reduce((result, item) => {
    result[getExamStatus(item)] += 1
    return result
  }, { DONE: 0, TODO: 0, PENDING: 0 }), [items])
  const visibleItems = useMemo(() => filterStudentExams(items, filters), [items, filters])
  return { items, visibleItems, counts, filters, loading: query.isLoading, error: query.isError && !query.data ? 'Không thể tải danh sách đề thi. Vui lòng thử lại.' : '', apiAvailable: Boolean(loadExams), retry: query.refetch, onChange: (key, value) => setFilters((current) => ({ ...current, [key]: value })) }
}
