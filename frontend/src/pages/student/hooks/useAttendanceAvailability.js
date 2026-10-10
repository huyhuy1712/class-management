import { useEffect, useState } from 'react'
import lessonService from '../../../services/lessonService'
import { getAttendanceDate, isAttendanceOpen } from '../helpers/attendanceWindow'

export default function useAttendanceAvailability(classIds) {
  const [now, setNow] = useState(() => new Date())
  const [result, setResult] = useState(null)
  const idsKey = [...new Set(classIds)].sort().join(',')
  const date = getAttendanceDate(now)
  const key = `${date}:${idsKey}`

  useEffect(() => {
    let active = true
    let fetching = false
    const load = async () => {
      if (fetching) return
      fetching = true
      const results = await Promise.allSettled((idsKey ? idsKey.split(',') : []).map(async (id) => {
        const lessons = await lessonService.getByDate(id, date)
        if (!Array.isArray(lessons)) throw new Error('Invalid lessons response')
        return lessons
      }))
      fetching = false
      if (!active) return
      setResult({ key, lessons: results.flatMap((item) => item.status === 'fulfilled' && Array.isArray(item.value) ? item.value : []), error: results.some((item) => item.status === 'rejected') })
      setNow(new Date())
    }
    load()
    const refresh = setInterval(load, 60000)
    const handleFocus = () => load()
    window.addEventListener('focus', handleFocus)
    return () => { active = false; clearInterval(refresh); window.removeEventListener('focus', handleFocus) }
  }, [idsKey, date, key])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loading = result?.key !== key
  const available = !loading && result.lessons.some((lesson) => isAttendanceOpen(lesson, now))
  return { available, reason: loading ? 'Đang kiểm tra giờ điểm danh...' : available ? '' : result?.error ? 'Không thể kiểm tra giờ điểm danh. Vui lòng tải lại trang.' : 'Hiện không có buổi học đang mở điểm danh' }
}
