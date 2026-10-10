import { useEffect, useState } from 'react'
import attendanceService from '../../../../services/attendanceService'
import useAuthStore from '../../../../stores/authStore'
import { getTodayDate } from '../../../../utils/dateUtils'

export default function useStudentAttendance(classId) {
  const user = useAuthStore((state) => state.user)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [date, setDate] = useState(getTodayDate)
  const [status, setStatus] = useState('ALL')
  useEffect(() => {
    let active = true
    attendanceService.getByClass(classId).then((data) => {
      if (!Array.isArray(data)) throw new Error('Invalid attendance response')
      if (active) setRecords(data.filter((item) => user?.id != null && String(item.studentId) === String(user.id)))
    }).catch(() => { if (active) setError('Không thể tải lịch sử điểm danh.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [classId, user?.id])
  const byDate = records.filter((item) => !date || item.date === date)
  const counts = Object.fromEntries(['PRESENT', 'ABSENT', 'LATE'].map((key) => [key, byDate.filter((item) => item.status === key).length]))
  const filtered = byDate.filter((item) => status === 'ALL' || item.status === status)
  const addRecords = (items) => setRecords((current) => [...current.filter((entry) => !items.some((item) => item.id === entry.id)), ...items])
  return { filtered, counts, loading, error, date, setDate, status, setStatus, addRecords }
}
