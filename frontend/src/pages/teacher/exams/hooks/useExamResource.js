import { useEffect, useState } from 'react'
import examService from '../../../../services/examService'

export default function useExamResource(examId, type) {
  const [result, setResult] = useState({ data: null, loading: true, error: '' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setResult({ data: null, loading: true, error: '' })
    const load = type === 'configuration' ? examService.getExamConfiguration : examService.getExamDetail
    load(examId).then((data) => {
      if (active) setResult({ data, loading: false, error: '' })
    }).catch((error) => {
      if (active) setResult({ data: null, loading: false, error: error.response?.data?.message || 'Không thể tải dữ liệu đề thi. Vui lòng thử lại.' })
    })
    return () => { active = false }
  }, [examId, type, attempt])
  return { ...result, retry: () => setAttempt((value) => value + 1) }
}
