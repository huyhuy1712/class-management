import { sortByText } from '../../../../utils/sortByText'
import { useMemo, useState } from 'react'

function useExamFilters(exams = []) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')

  // A_Z | NEWEST | OLDEST
  const [sortOrder, setSortOrder] = useState('A_Z')

  const filteredExams = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    const result = exams.filter((exam) => {
      const matchSearch =
        !keyword ||
        String(exam.title ?? '')
          .toLowerCase()
          .includes(keyword) ||
        String(exam.code ?? '')
          .toLowerCase()
          .includes(keyword)

      const matchStatus =
        status === 'ALL' ||
        exam.status === status

      return matchSearch && matchStatus
    })

    if (sortOrder === 'A_Z') return sortByText(result, (exam) => exam.title)

    // Không sort trực tiếp exams để tránh mutate state
    return [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()

      if (sortOrder === 'OLDEST') {
        return dateA - dateB
      }

      return dateB - dateA
    })
  }, [exams, search, status, sortOrder])

  return {
    search,
    setSearch,

    status,
    setStatus,

    sortOrder,
    setSortOrder,

    filteredExams,
  }
}

export default useExamFilters