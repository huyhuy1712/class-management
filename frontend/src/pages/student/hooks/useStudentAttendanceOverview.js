import { useQueries } from '@tanstack/react-query'
import useResourceQuery from '../../../query/useResourceQuery'
import { accountScope, resourceKey, EMPTY_LIST } from '../../../query/queryKeys'
import { getSessionVersion } from '../../../query/queryClient'
import { resourceOptions } from '../../../query/resourceOptions'
import useAuthStore from '../../../stores/authStore'

export default function useStudentAttendanceOverview() {
  const user = useAuthStore((state) => state.user)
  const classesQuery = useResourceQuery('studentClasses')
  const classes = classesQuery.data ?? EMPTY_LIST
  const account = accountScope(user, getSessionVersion())
  const queries = useQueries({ queries: classes.map((item) => ({ ...resourceOptions('attendances', [item.id]), queryKey: resourceKey(account, 'attendances', [item.id]), enabled: Boolean(account) })) })
  const records = queries.flatMap((query, index) => (query.data ?? []).filter((item) => user?.id != null && String(item.studentId) === String(user.id)).map((item) => ({ ...item, classroomId: classes[index].id })))
  return { classes, records, loading: classesQuery.isLoading || queries.some((query) => query.isLoading), error: classesQuery.errorMessage || (queries.some((query) => query.isError && !query.data) ? 'Không thể tải đầy đủ lịch sử điểm danh.' : '') }
}
