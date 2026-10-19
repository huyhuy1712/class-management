import { useMemo } from 'react'
import useResourceQuery from '../../../../query/useResourceQuery'

export default function useMaterialTargetOptions({ enabled = true } = {}) {
  const classesQuery = useResourceQuery('teacherClasses', [], { enabled })
  const studentsQuery = useResourceQuery('teacherStudents', [], { enabled })

  const options = useMemo(() => {
    const classes = (classesQuery.data ?? []).filter((classroom) => classroom.status === 'ACTIVE')
    const activeClassIds = new Set(classes.map((classroom) => String(classroom.id)))
    const students = (studentsQuery.data ?? []).filter((student) =>
      student.status === 'ACTIVE' &&
      student.classes?.some((classroom) => activeClassIds.has(String(classroom.id))),
    )
    const studentCounts = new Map()

    students.forEach((student) => {
      student.classes?.forEach((classroom) => {
        const classKey = String(classroom.id)
        if (activeClassIds.has(classKey)) {
          studentCounts.set(classKey, (studentCounts.get(classKey) ?? 0) + 1)
        }
      })
    })

    return {
      classes: classes.map((classroom) => ({
        ...classroom,
        studentCount: studentCounts.get(String(classroom.id)) ?? 0,
      })),
      students,
    }
  }, [classesQuery.data, studentsQuery.data])

  return {
    ...options,
    loading: classesQuery.isLoading || studentsQuery.isLoading,
    error: classesQuery.errorMessage || studentsQuery.errorMessage,
    retry: () => Promise.all([classesQuery.refetch(), studentsQuery.refetch()]),
  }
}
