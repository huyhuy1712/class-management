import { useEffect, useState } from 'react'
import userService from '../../../services/userService'
import useAuthStore from '../../../stores/authStore'

export default function useStudentDashboard() {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completedExamCount, setCompletedExamCount] = useState(null)
  const [examCountLoading, setExamCountLoading] = useState(true)
  const [examCountError, setExamCountError] = useState(false)

  useEffect(() => {
    let active = true

    userService.getMyStudentDashboard()
      .then((data) => {
        if (!active) return
        setDashboard(data)
        updateUser({ fullName: data.fullName })
      })
      .catch(() => { if (active) setError('Không thể tải dữ liệu học tập.') })
      .finally(() => { if (active) setLoading(false) })

    userService.getMyCompletedExamCount()
      .then((data) => { if (active) setCompletedExamCount(data.completedExamCount) })
      .catch(() => { if (active) setExamCountError(true) })
      .finally(() => { if (active) setExamCountLoading(false) })

    return () => { active = false }
  }, [updateUser])

  return {
    studentName: dashboard?.fullName || user?.fullName || 'Học sinh',
    activeClasses: (dashboard?.classes ?? []).filter((item) => item.status === 'ACTIVE'),
    loading,
    error,
    completedExamCount,
    examCountLoading,
    examCountError,
  }
}
