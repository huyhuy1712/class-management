import { useMemo, useState } from 'react'
import useResourceQuery from '../../../../query/useResourceQuery'
import { EMPTY_LIST } from '../../../../query/queryKeys'
import { filterStudentExams } from '../helpers/studentExamHelpers'

export default function useStudentExams() {
  const [filters, setFilters] = useState({ search: '', classId: '', date: '', order: 'NEWEST' })
  const query = useResourceQuery('studentExams', filters.order === 'OLDEST' ? ['OLDEST'] : [], { placeholderData: (previous) => previous })
  const items = query.data?.items ?? EMPTY_LIST
  const stats = query.data?.stats
  const counts = { DONE: stats?.completedCount ?? 0, TODO: stats?.notStartedCount ?? 0, PENDING: stats?.pendingGradingCount ?? 0 }
  const visibleItems = useMemo(() => filterStudentExams(items, { ...filters, order: 'SERVER' }), [items, filters])
  return { items, visibleItems, counts, filters, loading: query.isLoading, error: query.errorMessage, apiAvailable: true,
    retry: () => query.refetch(), onChange: (key, value) => setFilters((current) => ({ ...current, [key]: value })) }
}
