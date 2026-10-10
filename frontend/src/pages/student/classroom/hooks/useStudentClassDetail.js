import { useEffect, useState } from 'react'
import userService from '../../../../services/userService'
import classroomService from '../../../../services/classroomService'

export default function useStudentClassDetail(classId) {
  const [state, setState] = useState(null)
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const classes = await userService.getMyClasses()
        const classroom = classes.find((item) => String(item.id) === classId)
        if (!classroom || classroom.status !== 'ACTIVE') {
          if (active) setState({ classId, error: !classroom ? 'Bạn chưa tham gia lớp học này.' : 'Lớp học đã vô hiệu, bạn không thể vào lớp.' })
          return
        }
        let studentCount = null
        try { studentCount = (await classroomService.getStudents(classId)).length } catch { /* Keep class information available when count fails. */ }
        if (active) setState({ classId, classroom, studentCount })
      } catch {
        if (active) setState({ classId, error: 'Không thể tải thông tin lớp học.' })
      }
    }
    load()
    const refresh = () => load()
    window.addEventListener('focus', refresh)
    return () => { active = false; window.removeEventListener('focus', refresh) }
  }, [classId])
  return state?.classId === classId ? { ...state, loading: false } : { loading: true }
}
