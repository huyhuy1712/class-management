import { useEffect, useState } from 'react'
import classroomService from '../../../services/classroomService'
import userService from '../../../services/userService'

export default function useProfileActivity(student) {
  const [state, setState] = useState({ classes: [], classCount: null, classCountError: false, completedExamCount: null, examCountError: false })
  useEffect(() => {
    let active = true
    const loadClasses = student ? userService.getMyStudentDashboard() : classroomService.getMyClasses()
    loadClasses.then((data) => {
      const classes = student ? (data.classes ?? []).filter((item) => item.status === 'ACTIVE') : data
      if (active) setState((current) => ({ ...current, classes, classCount: classes.length }))
    }).catch(() => { if (active) setState((current) => ({ ...current, classCountError: true })) })
    if (student) userService.getMyCompletedExamCount().then((data) => {
      if (active) setState((current) => ({ ...current, completedExamCount: data.completedExamCount }))
    }).catch(() => { if (active) setState((current) => ({ ...current, examCountError: true })) })
    return () => { active = false }
  }, [student])
  return state
}
