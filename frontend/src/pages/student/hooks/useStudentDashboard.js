import { useEffect } from 'react'
import useResourceQuery from '../../../query/useResourceQuery'
import useAuthStore from '../../../stores/authStore'
import { getUnstartedAvailableExams } from '../exams/helpers/studentExamHelpers'

export default function useStudentDashboard() {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const dashboard = useResourceQuery('dashboard')
  const classes = useResourceQuery('studentClasses')
  const exams = useResourceQuery('examCount')
  const assignedExams = useResourceQuery('studentExams')
  const unstartedExams = getUnstartedAvailableExams(assignedExams.data?.items ?? [])
  useEffect(() => {
    if (dashboard.data?.fullName && dashboard.data.fullName !== user?.fullName) updateUser({ fullName: dashboard.data.fullName })
  }, [dashboard.data?.fullName, user?.fullName, updateUser])
  return {
    studentName: dashboard.data?.fullName || user?.fullName || 'Học sinh',
    classCount: classes.data?.length ?? 0,
    classError: Boolean(classes.errorMessage), loading: classes.isLoading,
    error: dashboard.errorMessage,
    completedExamCount: exams.data?.completedExamCount ?? null,
    examCountLoading: exams.isLoading, examCountError: Boolean(exams.errorMessage),
    unstartedExams, unstartedExamsError: assignedExams.errorMessage,
  }
}
