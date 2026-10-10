import { useEffect, useState } from 'react'
import userService from '../../../services/userService'
import classroomService from '../../../services/classroomService'

export default function useStudentClassList(teacherSearch) {
  const [result, setResult] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const [joined, available] = await Promise.allSettled([
        userService.getMyClasses(),
        teacherSearch ? classroomService.getAll() : Promise.resolve([]),
      ])
      if (!active) return
      const joinedClasses = joined.status === 'fulfilled' ? joined.value : []
      setResult({
        teacherSearch,
        classes: teacherSearch ? available.status === 'fulfilled' ? available.value : [] : joinedClasses,
        joinedClassIds: joinedClasses.map((item) => String(item.id)),
        classesError: (teacherSearch ? available : joined).status === 'rejected' ? 'Không thể tải danh sách lớp học.' : '',
        dashboardError: joined.status === 'rejected' ? 'Không thể tải các lớp bạn đã tham gia.' : '',
      })
    }
    load()
    return () => { active = false }
  }, [teacherSearch])

  if (!result || result.teacherSearch !== teacherSearch) {
    return { classes: [], joinedClassIds: [], classesError: '', dashboardError: '', loading: true }
  }
  return { ...result, loading: false }
}
