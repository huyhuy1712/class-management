import useResourceQuery from '../../../../query/useResourceQuery'

export default function useStudentClassDetail(classId) {
  const classes = useResourceQuery('studentClasses', [], { staleTime: 15_000 })
  const classroom = classes.data?.find((item) => String(item.id) === String(classId))
  const students = useResourceQuery('classStudents', [classId], { enabled: classroom?.status === 'ACTIVE' })
  const error = classes.errorMessage || (classes.data && (!classroom ? 'Bạn chưa tham gia lớp học này.' : classroom.status !== 'ACTIVE' ? 'Lớp học đã vô hiệu, bạn không thể vào lớp.' : ''))
  return { classId, classroom, studentCount: students.data?.length ?? null, error, loading: classes.isPending }
}
