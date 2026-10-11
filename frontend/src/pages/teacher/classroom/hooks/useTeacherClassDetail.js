import { useMutation } from '@tanstack/react-query'
import useResourceQuery from '../../../../query/useResourceQuery'
import classroomService from '../../../../services/classroomService'
import { optimisticRowOptions } from '../../../../query/optimisticUpdates'

export default function useTeacherClassDetail(classId) {
  const classes = useResourceQuery('teacherClasses')
  const activateMutation = useMutation(optimisticRowOptions(classes, (id) => ({ id, patch: { status: 'ACTIVE' } }), classroomService.activate))
  const classroom = classes.data?.find((item) => String(item.id) === String(classId))
  const students = useResourceQuery('classStudents', [classId], { enabled: Boolean(classroom) })
  const studentCount = students.data?.length ?? 0
  const handleActivate = async () => {
    const result = await activateMutation.mutateAsync(classId)
    classes.setData((current = []) => current.map((item) => String(item.id) === String(classId) ? result : item))
    return result
  }
  return { classroom, studentCount, handleActivate, activating: activateMutation.isPending, loading: classes.isPending, error: classes.errorMessage || (classes.data && !classroom ? 'Không tìm thấy lớp học.' : '') }
}
