import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { resourceOptions } from '../../../../query/resourceOptions'
import useResourceQuery from '../../../../query/useResourceQuery'
import { getSessionVersion } from '../../../../query/queryClient'
import { buildAssignmentGradeExport } from '../helpers/assignmentGradeExport'
import { assignmentGradeWorkbook } from '../helpers/assignmentGradeWorkbook'

export default function useAssignmentGradeExport(assignmentId, classId) {
  const query = useResourceQuery('teacherAssignmentExport', [assignmentId, classId], { enabled: false })
  const queryClient = useQueryClient()
  const prefetchInsights = () => {
    if (!query.queryKey[1]) return
    void queryClient.prefetchQuery({ ...resourceOptions('teacherAssignmentExport', [assignmentId, classId]), queryKey: query.queryKey })
  }
  const lock = useRef(false)
  const [generating, setGenerating] = useState(false)
  const exportGrades = async (title, maxScore) => {
    if (lock.current) return
    lock.current = true
    const version = getSessionVersion()
    try {
      const result = await query.refetch()
      if (version !== getSessionVersion()) return
      if (result.error) throw result.error
      setGenerating(true)
      const report = buildAssignmentGradeExport(result.data, maxScore)
      const buffer = await assignmentGradeWorkbook(report, title, assignmentId, maxScore)
      if (version !== getSessionVersion()) return
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `bang-diem-dot-${assignmentId}${classId ? `-lop-${classId}` : ''}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally { lock.current = false; setGenerating(false) }
  }
  return { exportGrades, exporting: query.isFetching || generating, prefetchInsights }
}
