import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useResourceQuery from '../../../../query/useResourceQuery'
import { resourceOptions } from '../../../../query/resourceOptions'
import { resourceKey } from '../../../../query/queryKeys'

export default function useClassGradebook(classId, filters) {
  const [search, setSearch] = useState(filters.q)
  useEffect(() => { const timer = setTimeout(() => setSearch(filters.q), 300); return () => clearTimeout(timer) }, [filters.q])
  const params = [classId, filters.page, search, filters.subjectId]
  const query = useResourceQuery('classGradebook', params)
  const client = useQueryClient()
  const prefetchNext = () => {
    const next = [...params]; next[1] += 1
    if (!query.queryKey[1]) return
    void client.prefetchQuery({ ...resourceOptions('classGradebook', next), queryKey: resourceKey(query.queryKey[1], 'classGradebook', next) })
  }
  return { ...query, prefetchNext }
}
