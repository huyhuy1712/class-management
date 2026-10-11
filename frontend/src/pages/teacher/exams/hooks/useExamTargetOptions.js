import { useMemo } from 'react'
import useResourceQuery from '../../../../query/useResourceQuery'

export default function useExamTargetOptions() {
  const subjects = useResourceQuery('subjects')
  const classes = useResourceQuery('teacherClasses')
  const students = useResourceQuery('teacherStudents')
  const options = useMemo(() => {
    const activeClasses = (classes.data ?? []).filter((item) => item.status === 'ACTIVE')
    const ids = new Set(activeClasses.map((item) => String(item.id)))
    const activeStudents = (students.data ?? []).filter((item) => item.status === 'ACTIVE' && item.classes?.some((group) => ids.has(String(group.id))))
    return { subjects: subjects.data ?? [], classes: activeClasses.map((item) => ({ ...item, studentCount: activeStudents.filter((student) => student.classes?.some((group) => String(group.id) === String(item.id))).length })), students: activeStudents }
  }, [subjects.data, classes.data, students.data])
  return { ...options, subjectsLoading: subjects.isLoading, subjectsError: subjects.errorMessage, loading: subjects.isLoading || classes.isLoading || students.isLoading, error: subjects.errorMessage || classes.errorMessage || students.errorMessage }
}
