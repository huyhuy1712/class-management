import useResourceQuery from '../../../../query/useResourceQuery'
import { useState } from 'react'
import useAuthStore from '../../../../stores/authStore'
import { getTodayDate } from '../../../../utils/dateUtils'

export default function useStudentAttendance(classId) {
  const user = useAuthStore((state) => state.user)
  const query = useResourceQuery('attendances', [classId], { enabled: Boolean(classId), errorMessage: 'Không thể tải lịch sử điểm danh.' })
  const records = (query.data ?? []).filter((item) => user?.id != null && String(item.studentId) === String(user.id))
  const loading = query.isLoading
  const error = query.errorMessage
  const [date, setDate] = useState(getTodayDate)
  const [status, setStatus] = useState('ALL')
  const byDate = records.filter((item) => !date || item.date === date)
  const counts = Object.fromEntries(['PRESENT', 'ABSENT', 'LATE'].map((key) => [key, byDate.filter((item) => item.status === key).length]))
  const filtered = byDate.filter((item) => status === 'ALL' || item.status === status)
  const addRecords = (items) => query.setData((current = []) => [...current.filter((entry) => !items.some((item) => item.id === entry.id)), ...items])
  return { filtered, counts, loading, error, date, setDate, status, setStatus, addRecords }
}
