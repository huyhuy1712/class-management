import { accountScope, resourceKey } from '../../../query/queryKeys'
import { useEffect, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import useAuthStore from '../../../stores/authStore'
import { getSessionVersion } from '../../../query/queryClient'
import { resourceOptions } from '../../../query/resourceOptions'
import { getAttendanceDate, isAttendanceOpen } from '../helpers/attendanceWindow'

export default function useAttendanceAvailability(classIds) {
  const user = useAuthStore((state) => state.user)
  const [now, setNow] = useState(() => new Date())
  const date = getAttendanceDate(now)
  const account = accountScope(user, getSessionVersion())
  const ids = [...new Set(classIds.map(String))].filter(Boolean).sort()
  const queries = useQueries({ queries: ids.map((id) => ({ ...resourceOptions('lessons', [id, date]), queryKey: resourceKey(account, 'lessons', [id, date]), enabled: Boolean(account) })) })
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  const loading = queries.some((query) => query.isLoading)
  const error = queries.some((query) => query.isError)
  const available = !loading && queries.some((query) => query.data?.some((lesson) => isAttendanceOpen(lesson, now)))
  return { available, reason: loading ? 'Đang kiểm tra giờ điểm danh...' : available ? '' : error ? 'Không thể kiểm tra giờ điểm danh. Vui lòng thử lại.' : 'Hiện không có buổi học đang mở điểm danh' }
}
