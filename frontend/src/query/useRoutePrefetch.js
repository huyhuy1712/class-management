import useAuthStore from '../stores/authStore'
import { getSessionVersion, queryClient } from './queryClient'
import { accountScope, resourceKey } from './queryKeys'
import { resourceOptions } from './resourceOptions'
import { routeQueries } from './prefetchRoutes'
import { getTodayDate } from '../utils/dateUtils'
import { getAttendanceDate } from '../pages/student/helpers/attendanceWindow'

export default function useRoutePrefetch() {
  return (path) => {
    const user = useAuthStore.getState().user
    const account = accountScope(user, getSessionVersion())
    if (!account) return
    if (path === '/student/grades') void import('../pages/student/grades/StudentGradesPage').catch(() => {})
    if (/^\/teacher\/exams\/[^/]+\/assignments\/[^/]+\/attempts\//.test(path)) void import('../pages/teacher/exams/TeacherAttemptReviewPage').catch(() => {})
    if (/^\/teacher\/exams\/[^/]+\/assignments\//.test(path)) void import('../pages/teacher/exams/TeacherAssignmentDetailPage').catch(() => {})
    if (/^\/teacher\/exams\/[^/]+$/.test(path) && !path.endsWith('/create')) {
      void import('../pages/teacher/exams/ExamDetailPage').catch(() => {})
    }
    if (/^\/student\/exam-attempts\/[^/]+\/result$/.test(path)) void import('../pages/student/exams/StudentExamResultPage').catch(() => {})
    else if (/^\/student\/exam-attempts\/[^/]+$/.test(path)) void import('../pages/student/exams/StudentExamAttemptPage').catch(() => {})
    const date = path.startsWith('/student/') ? getAttendanceDate(new Date()) : getTodayDate()
    for (const [resource, params] of routeQueries(path, user.id, date)) {
      const options = resourceOptions(resource, params)
      if (resource === 'studentClasses' && /^\/student\/classes\/[^/]+$/.test(path)) options.staleTime = 15_000
      void queryClient.prefetchQuery({ ...options, queryKey: resourceKey(account, resource, params) })
    }
  }
}
