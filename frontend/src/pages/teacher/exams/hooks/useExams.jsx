import { useCallback, useEffect, useState } from 'react'

import examService from '../../../../services/examService'

function getErrorMessage(error) {
  const status = error?.response?.status
  const data = error?.response?.data

  if (status === 401) {
    return 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
  }

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (data?.message) {
    return data.message
  }

  if (data?.error) {
    return data.error
  }

  return 'Không thể tải danh sách đề thi. Vui lòng thử lại.'
}

function useExams() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const data = await examService.getMyExams()

      setExams(
        Array.isArray(data)
          ? data
          : [],
      )
    } catch (error) {
      console.error('Get exams error:', error)

      setExams([])
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  return {
    exams,
    setExams,
    loading,
    error,
    refetch: fetchExams,
  }
}

export default useExams